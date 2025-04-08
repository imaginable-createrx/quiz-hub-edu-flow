
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Test, Submission, AnswerImage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface TestDataContextType {
  tests: Test[];
  submissions: Submission[];
  addTest: (test: Omit<Test, 'id' | 'createdAt'>) => Promise<string | undefined>;
  addSubmission: (submission: Omit<Submission, 'id' | 'submittedAt' | 'graded'>) => Promise<string | undefined>;
  gradeSubmission: (submissionId: string, score: number, feedback?: string) => Promise<void>;
  getTestById: (testId: string) => Test | undefined;
  getSubmissionById: (submissionId: string) => Submission | undefined;
  getSubmissionsByTestId: (testId: string) => Submission[];
  getSubmissionsByStudentId: (studentId: string) => Submission[];
  uploadTestFile: (testId: string, file: File) => Promise<string | null>;
  uploadAnswerImage: (submissionId: string, questionNumber: number, file: File) => Promise<string | null>;
}

const TestDataContext = createContext<TestDataContextType | undefined>(undefined);

export const TestDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const { user } = useAuth();

  // Fetch tests and submissions data
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_tests_with_files');

        if (error) {
          console.error('Error fetching tests:', error);
          return;
        }

        if (data) {
          const formattedTests: Test[] = data.map((test: any) => ({
            id: test.id,
            title: test.title,
            description: test.description || undefined,
            pdfUrl: test.file_path || '/placeholder.svg',
            numQuestions: test.num_questions,
            durationMinutes: test.duration_minutes,
            createdAt: test.created_at,
            createdBy: test.created_by
          }));
          
          setTests(formattedTests);
        }
      } catch (error) {
        console.error('Error in fetchTests:', error);
      }
    };

    fetchTests();
  }, []);

  // Fetch submissions when user changes
  useEffect(() => {
    if (!user) {
      setSubmissions([]);
      return;
    }

    const fetchSubmissions = async () => {
      try {
        // Use an RPC function to fetch submissions with answers
        let { data, error } = await supabase
          .rpc('get_submissions_with_answers', {
            current_user_id: user.id,
            is_student: user.role === 'student'
          });

        if (error) {
          console.error('Error fetching submissions:', error);
          return;
        }

        if (data) {
          const formattedSubmissions: Submission[] = data.map((sub: any) => {
            const answers: AnswerImage[] = sub.answer_images ? sub.answer_images.map((ans: any) => ({
              questionNumber: ans.question_number,
              imageUrl: ans.image_path
            })) : [];

            return {
              id: sub.id,
              testId: sub.test_id,
              studentId: sub.student_id,
              answers,
              submittedAt: sub.submitted_at,
              score: sub.score,
              feedback: sub.feedback,
              graded: sub.graded
            };
          });
          
          setSubmissions(formattedSubmissions);
        }
      } catch (error) {
        console.error('Error in fetchSubmissions:', error);
      }
    };

    fetchSubmissions();
  }, [user]);

  const uploadTestFile = async (testId: string, file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${testId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${testId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('test_files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('test_files')
        .getPublicUrl(filePath);

      // Save file info to database using RPC
      const { error: dbError } = await supabase
        .rpc('insert_test_file', {
          p_test_id: testId,
          p_file_path: urlData.publicUrl,
          p_file_name: file.name
        });

      if (dbError) {
        throw dbError;
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading test file:', error);
      toast.error('Failed to upload test file');
      return null;
    }
  };

  const uploadAnswerImage = async (
    submissionId: string, 
    questionNumber: number, 
    file: File
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${submissionId}_${questionNumber}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${submissionId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('answer_images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('answer_images')
        .getPublicUrl(filePath);

      // Save file info to database using RPC
      const { error: dbError } = await supabase
        .rpc('insert_answer_image', {
          p_submission_id: submissionId,
          p_question_number: questionNumber,
          p_image_path: urlData.publicUrl
        });

      if (dbError) {
        throw dbError;
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading answer image:', error);
      toast.error('Failed to upload answer image');
      return null;
    }
  };

  const addTest = async (test: Omit<Test, 'id' | 'createdAt'>): Promise<string | undefined> => {
    try {
      if (!user) {
        toast.error('You must be logged in to create a test');
        return;
      }

      // Use RPC function to insert test
      const { data, error } = await supabase
        .rpc('insert_test', {
          p_title: test.title,
          p_description: test.description || null,
          p_duration_minutes: test.durationMinutes,
          p_num_questions: test.numQuestions,
          p_created_by: user.id
        });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newTestId = data[0].id;
        toast.success('Test created successfully!');
        
        // Refresh tests using the RPC function
        const { data: newTests, error: fetchError } = await supabase
          .rpc('get_tests_with_files');

        if (!fetchError && newTests) {
          const formattedTests: Test[] = newTests.map((test: any) => ({
            id: test.id,
            title: test.title,
            description: test.description || undefined,
            pdfUrl: test.file_path || '/placeholder.svg',
            numQuestions: test.num_questions,
            durationMinutes: test.duration_minutes,
            createdAt: test.created_at,
            createdBy: test.created_by
          }));
          
          setTests(formattedTests);
        }
        
        return newTestId;
      }
    } catch (error) {
      console.error('Error adding test:', error);
      toast.error('Failed to create test: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const addSubmission = async (
    submission: Omit<Submission, 'id' | 'submittedAt' | 'graded'>
  ): Promise<string | undefined> => {
    try {
      if (!user) {
        toast.error('You must be logged in to submit a test');
        return;
      }

      // Use RPC function to insert submission
      const { data, error } = await supabase
        .rpc('insert_submission', {
          p_test_id: submission.testId,
          p_student_id: submission.studentId
        });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newSubmissionId = data[0].id;
        toast.success('Test submitted successfully!');
        
        // Refresh submissions
        const { data: newSubmissions, error: fetchError } = await supabase
          .rpc('get_submissions_with_answers', {
            current_user_id: user.id,
            is_student: user.role === 'student'
          });

        if (!fetchError && newSubmissions) {
          const formattedSubmissions: Submission[] = newSubmissions.map((sub: any) => {
            const answers: AnswerImage[] = sub.answer_images ? sub.answer_images.map((ans: any) => ({
              questionNumber: ans.question_number,
              imageUrl: ans.image_path
            })) : [];

            return {
              id: sub.id,
              testId: sub.test_id,
              studentId: sub.student_id,
              answers,
              submittedAt: sub.submitted_at,
              score: sub.score,
              feedback: sub.feedback,
              graded: sub.graded
            };
          });
          
          setSubmissions(formattedSubmissions);
        }
        
        return newSubmissionId;
      }
    } catch (error) {
      console.error('Error adding submission:', error);
      toast.error('Failed to submit test: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const gradeSubmission = async (submissionId: string, score: number, feedback?: string): Promise<void> => {
    try {
      if (!user || user.role !== 'teacher') {
        toast.error('Only teachers can grade submissions');
        return;
      }

      // Use RPC function to grade submission
      const { error } = await supabase
        .rpc('grade_submission', {
          p_submission_id: submissionId,
          p_score: score,
          p_feedback: feedback || null
        });

      if (error) {
        throw error;
      }

      // Update local state
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, score, feedback, graded: true } 
            : sub
        )
      );

      toast.success('Submission graded successfully!');
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Failed to grade submission: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getTestById = (testId: string) => tests.find(test => test.id === testId);
  
  const getSubmissionById = (submissionId: string) => 
    submissions.find(sub => sub.id === submissionId);
  
  const getSubmissionsByTestId = (testId: string) => 
    submissions.filter(sub => sub.testId === testId);
  
  const getSubmissionsByStudentId = (studentId: string) => 
    submissions.filter(sub => sub.studentId === studentId);

  return (
    <TestDataContext.Provider 
      value={{ 
        tests, 
        submissions, 
        addTest, 
        addSubmission, 
        gradeSubmission,
        getTestById,
        getSubmissionById,
        getSubmissionsByTestId,
        getSubmissionsByStudentId,
        uploadTestFile,
        uploadAnswerImage
      }}
    >
      {children}
    </TestDataContext.Provider>
  );
};

export const useTestData = () => {
  const context = useContext(TestDataContext);
  if (context === undefined) {
    throw new Error('useTestData must be used within a TestDataProvider');
  }
  return context;
};
