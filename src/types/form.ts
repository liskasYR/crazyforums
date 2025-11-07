export type QuestionType = 'text' | 'textarea' | 'multiple-choice' | 'checkbox' | 'number';

export interface Option {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: Option[];
}

export interface FormStyle {
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  borderRadius: string;
  spacing: string;
  backgroundType: 'solid' | 'gradient' | 'image';
  gradientStart?: string;
  gradientEnd?: string;
  gradientDirection?: string;
  backgroundImage?: string;
  successMessage?: string;
  closedMessage?: string;
}

export interface FormResponse {
  id: string;
  submittedAt: string;
  answers: Record<string, any>;
}

export interface Form {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  style: FormStyle;
  status: 'open' | 'closed';
  responses: FormResponse[];
}
