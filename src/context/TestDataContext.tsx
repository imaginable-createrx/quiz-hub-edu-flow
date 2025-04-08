
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Test, Submission } from '@/types';

interface TestDataContextType {
  tests: Test[];
  submissions: Submission[];
  addTest: (test: Omit<Test, 'id' | 'createdAt'>) => void;
  addSubmission: (submission: Omit<Submission, 'id' | 'submittedAt' | 'graded'>) => void;
  gradeSubmission: (submissionId: string, score: number, feedback?: string) => void;
  getTestById: (testId: string) => Test | undefined;
  getSubmissionById: (submissionId: string) => Submission | undefined;
  getSubmissionsByTestId: (testId: string) => Submission[];
  getSubmissionsByStudentId: (studentId: string) => Submission[];
}

const TestDataContext = createContext<TestDataContextType | undefined>(undefined);

// Mock data
const INITIAL_TESTS: Test[] = [
  {
    id: 't1',
    title: 'Math Midterm Exam',
    description: 'Covers algebra and geometry concepts from chapters 1-5',
    pdfUrl: '/sample-math-test.pdf',
    numQuestions: 10,
    durationMinutes: 60,
    createdAt: '2023-04-01T10:00:00Z',
    createdBy: 't1'
  },
  {
    id: 't2',
    title: 'English Literature Quiz',
    description: 'Short quiz on Shakespeare\'s works',
    pdfUrl: '/sample-english-test.pdf',
    numQuestions: 5,
    durationMinutes: 30,
    createdAt: '2023-04-05T14:30:00Z',
    createdBy: 't1'
  }
];

const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 's1',
    testId: 't1',
    studentId: 's1',
    answers: [
      { questionNumber: 1, imageUrl: '/sample-answer-1.jpg' },
      { questionNumber: 2, imageUrl: '/sample-answer-2.jpg' }
    ],
    submittedAt: '2023-04-02T11:30:00Z',
    graded: false
  }
];

export const TestDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    // Load from localStorage or use initial data
    const savedTests = localStorage.getItem('edutest-tests');
    const savedSubmissions = localStorage.getItem('edutest-submissions');
    
    setTests(savedTests ? JSON.parse(savedTests) : INITIAL_TESTS);
    setSubmissions(savedSubmissions ? JSON.parse(savedSubmissions) : INITIAL_SUBMISSIONS);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('edutest-tests', JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem('edutest-submissions', JSON.stringify(submissions));
  }, [submissions]);

  const addTest = (test: Omit<Test, 'id' | 'createdAt'>) => {
    const newTest: Test = {
      ...test,
      id: `test-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    setTests(prev => [...prev, newTest]);
  };

  const addSubmission = (submission: Omit<Submission, 'id' | 'submittedAt' | 'graded'>) => {
    const newSubmission: Submission = {
      ...submission,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      graded: false
    };
    
    setSubmissions(prev => [...prev, newSubmission]);
  };

  const gradeSubmission = (submissionId: string, score: number, feedback?: string) => {
    setSubmissions(prev => 
      prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, score, feedback, graded: true } 
          : sub
      )
    );
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
        getSubmissionsByStudentId
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
