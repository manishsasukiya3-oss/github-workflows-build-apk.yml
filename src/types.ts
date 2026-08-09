export type UserRole = 'admin' | 'user';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  password?: string;
  mobileNumber?: string;
  role: UserRole;
  groupIds: string[];
  status?: 'active' | 'deactivated';
  createdAt: string;
}

export interface Group {
  groupId: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
}

export interface PDFItem {
  pdfId: string;
  title: string;
  description: string;
  category: string;
  storagePath: string;
  storageUrl: string;
  fileName: string;
  fileSize: number;
  groupIds: string[]; // Can contain specific group IDs or 'all'
  uploadedAt: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed position
  explanation: string;
  marks: number;
}

export interface Test {
  testId: string;
  title: string;
  description: string;
  category: string;
  duration: number; // in minutes
  totalMarks: number;
  groupIds: string[]; // Can contain specific group IDs or 'all'
  createdAt: string;
  questions: Question[];
}

export interface TestResult {
  resultId: string;
  userId: string;
  userName: string;
  userEmail: string;
  testId: string;
  testTitle: string;
  groupIds: string[];
  score: number;
  totalMarks: number;
  percentage: number;
  correct: number;
  wrong: number;
  unanswered: number;
  completionTimeSeconds: number;
  submittedAt: string;
  userAnswers?: Record<string, number>; // questionId -> selectedOptionIndex
}
