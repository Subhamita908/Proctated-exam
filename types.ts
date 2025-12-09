
export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  starterCode?: string;
}

export enum ExamStatus {
  IDLE = 'IDLE',
  LOGIN = 'LOGIN',
  SETUP = 'SETUP', // Checking permissions
  LOADING_QUESTIONS = 'LOADING_QUESTIONS',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED', // Due to cheating
}

export interface ProctorState {
  warnings: number;
  lastViolation: string | null;
  isCameraActive: boolean;
  isMicrophoneActive: boolean;
}

export interface UserSubmission {
  questionId: string;
  code: string;
}

export interface AssessmentResult {
  studentEmail: string;
  score: number; // 0 to 100
  feedback: string;
  submittedAt: string;
  status: 'Pass' | 'Fail' | 'Review';
}

export interface ExamConfig {
  durationMinutes: number; // e.g., 60
  minTimeBeforeSubmitMinutes: number; // e.g., 45
  title: string;
}

export type UserRole = 'ADMIN' | 'STUDENT' | null;
