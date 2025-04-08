
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
          .from('tests')
          .select(`
            id, 
            title, 
            description, 
            num_questions,
            duration_minutes,
            created_at,
            created_by,
            test_files (file_path)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tests:', error);
          return;
        }

        if (data) {
          const formattedTests: Test[] = data.map((test: any) => ({
            id: test.id,
            title: test.title,
            description: test.description || undefined,
            pdfUrl: test.test_files && test.test_files.length > 0 ? 
              test.test_files[0].file_path : '/placeholder.svg',
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
        // Use a join query to fetch submissions with answers
        const { data, error } = await supabase
          .from('submissions')
          .select(`
            id,
            test_id,
            student_id,
            submitted_at,
            score,
            feedback,
            graded,
            answer_images (question_number, image_path)
          `)
          .eq(user.role === 'student' ? 'student_id' : 'id', user.role === 'student' ? user.id : 'not.eq.null')
          .order('submitted_at', { ascending: false });

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

      // Save file info to database
      const { error: dbError } = await supabase
        .from('test_files')
        .insert({
          test_id: testId,
          file_path: urlData.publicUrl,
          file_name: file.name
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

      // Save file info to database
      const { error: dbError } = await supabase
        .from('answer_images')
        .insert({
          submission_id: submissionId,
          question_number: questionNumber,
          image_path: urlData.publicUrl
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

      // Insert test directly
      const { data, error } = await supabase
        .from('tests')
        .insert({
          title: test.title,
          description: test.description || null,
          duration_minutes: test.durationMinutes,
          num_questions: test.numQuestions,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const newTestId = data.id;
        toast.success('Test created successfully!');
        
        // Refresh tests
        const { data: newTests, error: fetchError } = await supabase
          .from('tests')
          .select(`
            id, 
            title, 
            description, 
            num_questions,
            duration_minutes,
            created_at,
            created_by,
            test_files (file_path)
          `)
          .order('created_at', { ascending: false });

        if (!fetchError && newTests) {
          const formattedTests: Test[] = newTests.map((test: any) => ({
            id: test.id,
            title: test.title,
            description: test.description || undefined,
            pdfUrl: test.test_files && test.test_files.length > 0 ? 
              test.test_files[0].file_path : '/placeholder.svg',
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

      // Insert submission directly
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          test_id: submission.testId,
          student_id: submission.studentId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const newSubmissionId = data.id;
        toast.success('Test submitted successfully!');
        
        // Refresh submissions
        const { data: newSubmissions, error: fetchError } = await supabase
          .from('submissions')
          .select(`
            id,
            test_id,
            student_id,
            submitted_at,
            score,
            feedback,
            graded,
            answer_images (question_number, image_path)
          `)
          .eq(user.role === 'student' ? 'student_id' : 'id', user.role === 'student' ? user.id : 'not.eq.null')
          .order('submitted_at', { ascending: false });

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

      // Update submission directly
      const { error } = await supabase
        .from('submissions')
        .update({
          score,
          feedback: feedback || null,
          graded: true
        })
        .eq('id', submissionId);

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
