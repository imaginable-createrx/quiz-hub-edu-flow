
export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  pdfUrl: string;
  numQuestions: number;
  durationMinutes: number;
  createdAt: string;
  createdBy: string;
}

export interface Submission {
  id: string;
  testId: string;
  studentId: string;
  answers: AnswerImage[];
  submittedAt: string;
  score?: number;
  feedback?: string;
  graded: boolean;
}

export interface AnswerImage {
  questionNumber: number;
  imageUrl: string;
}
