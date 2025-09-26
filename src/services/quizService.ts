import { canAccessContent, type AccessLevel } from '@/lib/contentAccess';
import { supabase } from '@/integrations/supabase/client';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  quizDifficulty?: number;
  quizAccessLevel?: string;
  originalCorrectAnswer?: string; // Store the original correct answer text
  shuffledOptions?: string[]; // Store the shuffled order
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  category: string;
  questions: QuizQuestion[];
  access_level: AccessLevel;
  estimatedTime?: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  answers: Record<number, number>;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export const getDifficultyLabel = (difficulty: number): string => {
  if (difficulty <= 2) return 'Beginner';
  if (difficulty <= 4) return 'Intermediate';
  return 'Advanced';
};

export const getDifficultyColor = (difficulty: number): string => {
  if (difficulty <= 2) return 'bg-green-100 text-green-800';
  if (difficulty <= 4) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

// Fisher-Yates shuffle algorithm for proper randomization
export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Function to shuffle options and track correct answer position
export const shuffleQuestionOptions = (question: any): QuizQuestion => {
  const originalOptions = [...question.options];
  const shuffledOptions = shuffleArray(originalOptions);
  
  // Find the new position of the correct answer
  const correctAnswerIndex = shuffledOptions.findIndex(
    option => option === question.correct_answer
  );

  return {
    id: question.id || `question-${Math.random().toString(36).substr(2, 9)}`,
    question: question.question,
    options: shuffledOptions,
    correctAnswer: correctAnswerIndex,
    explanation: question.explanation,
    originalCorrectAnswer: question.correct_answer,
    shuffledOptions: shuffledOptions
  };
};

// Generate a session key for 24-hour randomization cycle
const getSessionKey = (): string => {
  const now = new Date();
  const hoursSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24)); // 24-hour cycles
  return `quiz-session-${hoursSinceEpoch}`;
};

// Store session data to maintain consistent randomization for 24 hours
const getSessionQuestions = (questions: QuizQuestion[]): QuizQuestion[] => {
  const sessionKey = getSessionKey();
  const storedSession = sessionStorage.getItem(sessionKey);
  
  if (storedSession) {
    try {
      return JSON.parse(storedSession);
    } catch (error) {
      console.warn('Failed to parse stored session, generating new one');
    }
  }

  // Store new session for 24 hours
  const sessionData = JSON.stringify(questions);
  sessionStorage.setItem(sessionKey, sessionData);
  
  return questions;
};

export const fetchQuestionsByTier = async (userTier: string): Promise<QuizQuestion[]> => {
  let difficultyRange: number[];
  let questionCount: number;

  switch (userTier) {
    case 'free':
      difficultyRange = [1];
      questionCount = 10;
      break;
    case 'basic':
      difficultyRange = [1, 2];
      questionCount = 20;
      break;
    case 'premium':
      difficultyRange = [1, 2, 3, 4];
      questionCount = 30;
      break;
    case 'professional':
      difficultyRange = [1, 2, 3, 4, 5];
      questionCount = 50;
      break;
    default:
      difficultyRange = [1];
      questionCount = 10;
  }

  const { data, error } = await supabase
    .from('quizzes')
    .select('questions, difficulty, access_level')
    .in('difficulty', difficultyRange)
    .lte('access_level', userTier);

  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }

  let allQuestions: QuizQuestion[] = [];
  data.forEach(quiz => {
    if (quiz.questions && Array.isArray(quiz.questions)) {
      quiz.questions.forEach((q: any) => {
        if (q.options && q.correct_answer && q.options.includes(q.correct_answer)) {
          const shuffledQuestion = shuffleQuestionOptions(q);
          allQuestions.push({
            ...shuffledQuestion,
            quizDifficulty: quiz.difficulty,
            quizAccessLevel: quiz.access_level
          });
        } else {
          console.warn('Invalid question format:', q);
        }
      });
    }
  });

  const shuffledQuestions = shuffleArray(allQuestions);
  const selectedQuestions = shuffledQuestions.slice(0, questionCount);
  
  return getSessionQuestions(selectedQuestions);
};

// Mock quiz data with access levels
export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Basic Music Theory',
    description: 'Test your knowledge of fundamental music theory concepts',
    difficulty: 1,
    category: 'Music Theory',
    access_level: 'free',
    questions: [
      {
        id: 'q1',
        question: 'How many notes are in a major scale?',
        options: ['6', '7', '8', '12'],
        correctAnswer: 1,
        explanation: 'A major scale contains 7 distinct notes before repeating the octave.'
      },
      {
        id: 'q2',
        question: 'What is the interval between C and E?',
        options: ['Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th'],
        correctAnswer: 2,
        explanation: 'C to E is a major third interval.'
      }
    ]
  },
  {
    id: 'quiz-2',
    title: 'Vocal Techniques',
    description: 'Assess your understanding of vocal training methods',
    difficulty: 2,
    category: 'Vocal Development',
    access_level: 'auth',
    questions: [
      {
        id: 'q1',
        question: 'What is the primary purpose of vocal warm-ups?',
        options: ['Increase volume', 'Prepare vocal cords', 'Change pitch range', 'Improve rhythm'],
        correctAnswer: 1,
        explanation: 'Vocal warm-ups prepare the vocal cords for singing and prevent strain.'
      }
    ]
  }
];

export const fetchQuizzes = async (): Promise<Quiz[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockQuizzes;
};

export const fetchQuizById = async (id: string): Promise<Quiz | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockQuizzes.find(quiz => quiz.id === id) || null;
};

export const fetchUserQuizAttempts = async (userId: string): Promise<QuizAttempt[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return [];
};

export const saveQuizAttempt = async (
  userId: string, 
  quizId: string, 
  score: number, 
  answers: Record<number, number>, 
  completed: boolean
): Promise<QuizAttempt> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const attempt: QuizAttempt = {
    id: `attempt-${Date.now()}`,
    user_id: userId,
    quiz_id: quizId,
    score,
    answers,
    completed,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return attempt;
};

export const getAccessibleQuizzes = (user: any, userSubscriptionTier: string = 'free'): Quiz[] => {
  return mockQuizzes.filter(quiz => 
    canAccessContent(quiz.access_level, user, userSubscriptionTier as any)
  );
};
