
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO format date string
  createdAt: string; // ISO format date string
  createdBy: string; // teacher ID
  attachmentUrl?: string; // Optional URL to attachment
  status: 'active' | 'completed';
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  studentId: string;
  submittedAt: string; // ISO format date string
  status: 'submitted' | 'reviewed';
  feedback?: string;
  attachmentUrl?: string; // URL to photo/video confirmation
}
