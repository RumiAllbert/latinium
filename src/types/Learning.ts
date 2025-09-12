export interface TutorStep {
  title: string;
  prompt: string;
  hint?: string;
  answer?: string;
}

export interface TutorExplanation {
  sentence: string;
  translation?: string;
  steps: TutorStep[];
}

export interface QuizOption {
  text: string;
}

export interface QuizQuestion {
  id: string;
  type: string; // e.g., identify-subject, identify-tense, translate
  prompt: string;
  options: QuizOption[];
  correctIndex: number;
  explanation?: string;
}

export interface QuizPayload {
  sentence: string;
  questions: QuizQuestion[];
}

