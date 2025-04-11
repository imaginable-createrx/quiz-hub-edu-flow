
import { Test, Submission } from '@/types';

export const getTestById = (tests: Test[], testId: string): Test | undefined => 
  tests.find(test => test.id === testId);

export const getSubmissionById = (submissions: Submission[], submissionId: string): Submission | undefined => 
  submissions.find(sub => sub.id === submissionId);

export const getSubmissionsByTestId = (submissions: Submission[], testId: string): Submission[] => 
  submissions.filter(sub => sub.testId === testId);

export const getSubmissionsByStudentId = (submissions: Submission[], studentId: string): Submission[] => 
  submissions.filter(sub => sub.studentId === studentId);
