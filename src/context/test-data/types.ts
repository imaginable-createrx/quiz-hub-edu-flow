
import { Test, Submission, AnswerImage } from '@/types';

export interface TestDataContextType {
  tests: Test[];
  submissions: Submission[];
  addTest: (test: Omit<Test, 'id' | 'createdAt'>) => Promise<string | undefined>;
  deleteTest: (testId: string) => Promise<boolean>;
  addSubmission: (submission: Omit<Submission, 'id' | 'submittedAt' | 'graded'>) => Promise<string | undefined>;
  gradeSubmission: (submissionId: string, score: number, feedback?: string) => Promise<void>;
  getTestById: (testId: string) => Test | undefined;
  getSubmissionById: (submissionId: string) => Submission | undefined;
  getSubmissionsByTestId: (testId: string) => Submission[];
  getSubmissionsByStudentId: (studentId: string) => Submission[];
  uploadTestFile: (testId: string, file: File) => Promise<string | null>;
  uploadAnswerImage: (submissionId: string, questionNumber: number, file: File) => Promise<string | null>;
}
