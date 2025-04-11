import React, { createContext, useContext, useState, useEffect } from 'react';
import { Test, Submission } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { TestDataContextType } from './test-data/types';
import { uploadTestFile, uploadAnswerImage } from './test-data/upload-utils';
import { fetchTests, addTest as addTestOperation, deleteTest as deleteTestOperation } from './test-data/test-operations';
import { 
  fetchSubmissions, 
  addSubmission as addSubmissionOperation,
  gradeSubmission as gradeSubmissionOperation 
} from './test-data/submission-operations';
import { 
  getTestById, 
  getSubmissionById, 
  getSubmissionsByTestId, 
  getSubmissionsByStudentId 
} from './test-data/data-retrieval';

const TestDataContext = createContext<TestDataContextType | undefined>(undefined);

export const TestDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const { user } = useAuth();

  // Fetch tests data
  useEffect(() => {
    const loadTests = async () => {
      const testsData = await fetchTests();
      setTests(testsData);
    };

    loadTests();
  }, []);

  // Fetch submissions when user changes
  useEffect(() => {
    const loadSubmissions = async () => {
      const submissionsData = await fetchSubmissions(user);
      setSubmissions(submissionsData);
    };

    loadSubmissions();
  }, [user]);

  const addTest = async (testData: Omit<Test, 'id' | 'createdAt'>): Promise<string | undefined> => {
    if (!user) return undefined;
    
    const newTestId = await addTestOperation(testData, user.id);
    
    if (newTestId) {
      // Refresh tests
      const refreshedTests = await fetchTests();
      setTests(refreshedTests);
    }
    
    return newTestId;
  };

  const deleteTest = async (testId: string): Promise<boolean> => {
    const success = await deleteTestOperation(testId, user?.role);
    
    if (success) {
      // Update local state
      setTests(prev => prev.filter(t => t.id !== testId));
      // Also remove any submissions related to this test to keep UI in sync
      setSubmissions(prev => prev.filter(s => s.testId !== testId));
    }
    
    return success;
  };

  const addSubmission = async (
    submissionData: Omit<Submission, 'id' | 'submittedAt' | 'graded'>
  ): Promise<string | undefined> => {
    const newSubmissionId = await addSubmissionOperation(submissionData, user?.id);
    
    if (newSubmissionId) {
      // Refresh submissions
      const refreshedSubmissions = await fetchSubmissions(user);
      setSubmissions(refreshedSubmissions);
    }
    
    return newSubmissionId;
  };

  const gradeSubmission = async (
    submissionId: string, 
    score: number, 
    feedback?: string
  ): Promise<void> => {
    const success = await gradeSubmissionOperation(submissionId, score, feedback, user?.role);
    
    if (success) {
      // Update local state
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, score, feedback, graded: true } 
            : sub
        )
      );
    }
  };

  return (
    <TestDataContext.Provider 
      value={{ 
        tests, 
        submissions, 
        addTest,
        deleteTest, 
        addSubmission, 
        gradeSubmission,
        getTestById: (testId: string) => getTestById(tests, testId),
        getSubmissionById: (submissionId: string) => getSubmissionById(submissions, submissionId),
        getSubmissionsByTestId: (testId: string) => getSubmissionsByTestId(submissions, testId),
        getSubmissionsByStudentId: (studentId: string) => getSubmissionsByStudentId(submissions, studentId),
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
