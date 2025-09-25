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

// Helper function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Question rotation management
interface QuestionRotationState {
  usedQuestionIds: Set<string>;
  rotationEnabled: boolean;
  tierRotations: Map<string, Set<string>>;
}

const rotationState: QuestionRotationState = {
  usedQuestionIds: new Set(),
  rotationEnabled: true,
  tierRotations: new Map()
};

// Get tier-specific rotation state
const getTierRotation = (tier: string): Set<string> => {
  if (!rotationState.tierRotations.has(tier)) {
    rotationState.tierRotations.set(tier, new Set());
  }
  return rotationState.tierRotations.get(tier)!;
};

// Reset rotation for a specific tier when all questions are used
const resetTierRotation = (tier: string) => {
  rotationState.tierRotations.set(tier, new Set());
};

// Toggle rotation system on/off
export const toggleQuestionRotation = (enabled: boolean) => {
  rotationState.rotationEnabled = enabled;
  if (!enabled) {
    // Clear all rotation state when disabled
    rotationState.usedQuestionIds.clear();
    rotationState.tierRotations.clear();
  }
};

// Check if rotation is enabled
export const isRotationEnabled = (): boolean => {
  return rotationState.rotationEnabled;
};

// Enhanced function with rotation system
export const fetchQuestionsByTier = async (
  userTier: string, 
  useRotation: boolean = true
): Promise<QuizQuestion[]> => {
  let difficultyRange: number[];
  let questionCount: number;

  // Define parameters based on user tier
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
      difficultyRange = [1, 2, 3, 4];
      questionCount = 50;
      break;
    default:
      difficultyRange = [1];
      questionCount = 10;
  }

  // Try to fetch from Supabase, fallback to mock data if needed
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('questions, difficulty, access_level')
      .in('difficulty', difficultyRange);

    if (!error && data && data.length > 0) {
      // Extract and flatten questions from Supabase
      let allQuestions: QuizQuestion[] = [];
      data.forEach(quiz => {
        if (quiz.questions && Array.isArray(quiz.questions)) {
          quiz.questions.forEach((q: any) => {
            // Convert correct_answer from string to numerical index
            const correctAnswerIndex = q.options.findIndex((option: string) => option === q.correct_answer);
            
            if (correctAnswerIndex !== -1) {
              allQuestions.push({
                id: q.id || `question-${Math.random().toString(36).substr(2, 9)}`,
                question: q.question,
                options: q.options,
                correctAnswer: correctAnswerIndex,
                explanation: q.explanation,
                quizDifficulty: quiz.difficulty,
                quizAccessLevel: quiz.access_level
              });
            } else {
              console.warn('Could not find correct answer in options:', q);
            }
          });
        }
      });

      // Apply rotation system if enabled and we have questions
      if (allQuestions.length > 0) {
        if (useRotation && rotationState.rotationEnabled) {
          const tierUsedQuestions = getTierRotation(userTier);
          
          // Filter out already used questions
          let availableQuestions = allQuestions.filter(q => !tierUsedQuestions.has(q.id));
          
          // If we don't have enough unused questions, reset rotation and use all
          if (availableQuestions.length < questionCount) {
            console.log(`Resetting rotation for tier ${userTier} - used ${tierUsedQuestions.size} questions`);
            resetTierRotation(userTier);
            availableQuestions = allQuestions;
          }
          
          // Select questions from available pool
          const shuffledQuestions = shuffleArray(availableQuestions);
          const selectedQuestions = shuffledQuestions.slice(0, questionCount);
          
          // Mark selected questions as used
          selectedQuestions.forEach(q => {
            getTierRotation(userTier).add(q.id);
          });
          
          return selectedQuestions;
        } else {
          // Original behavior - just shuffle without rotation
          const shuffledQuestions = shuffleArray(allQuestions);
          return shuffledQuestions.slice(0, questionCount);
        }
      }
    }
  } catch (error) {
    console.warn('Error fetching from Supabase, falling back to mock data:', error);
  }

  // Fallback to mock quiz questions
  const mockQuestions = generateMockQuestions(userTier, questionCount);
  
  if (useRotation && rotationState.rotationEnabled) {
    const tierUsedQuestions = getTierRotation(userTier);
    
    // Filter out already used questions
    let availableQuestions = mockQuestions.filter(q => !tierUsedQuestions.has(q.id));
    
    // If we don't have enough unused questions, reset rotation and use all
    if (availableQuestions.length < questionCount) {
      console.log(`Resetting rotation for tier ${userTier} - used ${tierUsedQuestions.size} questions`);
      resetTierRotation(userTier);
      availableQuestions = mockQuestions;
    }
    
    // Select questions from available pool
    const shuffledQuestions = shuffleArray(availableQuestions);
    const selectedQuestions = shuffledQuestions.slice(0, questionCount);
    
    // Mark selected questions as used
    selectedQuestions.forEach(q => {
      getTierRotation(userTier).add(q.id);
    });
    
    return selectedQuestions;
  } else {
    // Original behavior - just shuffle without rotation
    const shuffledQuestions = shuffleArray(mockQuestions);
    return shuffledQuestions.slice(0, questionCount);
  }
};

// Alternative function for getting fresh questions without rotation
export const fetchRandomQuestionsByTier = async (userTier: string): Promise<QuizQuestion[]> => {
  return fetchQuestionsByTier(userTier, false);
};

// Generate mock questions based on tier
const generateMockQuestions = (tier: string, count: number): QuizQuestion[] => {
  const baseQuestions: QuizQuestion[] = [
    {
      id: 'mock-q1',
      question: 'How many notes are in a major scale?',
      options: ['6', '7', '8', '12'],
      correctAnswer: 1,
      explanation: 'A major scale contains 7 distinct notes before repeating the octave.'
    },
    {
      id: 'mock-q2',
      question: 'What is the interval between C and E?',
      options: ['Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th'],
      correctAnswer: 2,
      explanation: 'C to E is a major third interval.'
    },
    {
      id: 'mock-q3',
      question: 'Which clef is typically used for higher-pitched instruments?',
      options: ['Bass clef', 'Treble clef', 'Alto clef', 'Tenor clef'],
      correctAnswer: 1,
      explanation: 'The treble clef is used for higher-pitched instruments and voices.'
    },
    {
      id: 'mock-q4',
      question: 'What does "forte" mean in musical dynamics?',
      options: ['Soft', 'Medium', 'Loud', 'Very fast'],
      correctAnswer: 2,
      explanation: 'Forte (f) indicates loud volume in musical dynamics.'
    },
    {
      id: 'mock-q5',
      question: 'How many beats does a whole note receive in 4/4 time?',
      options: ['1', '2', '3', '4'],
      correctAnswer: 3,
      explanation: 'A whole note receives 4 beats in 4/4 time signature.'
    },
    {
      id: 'mock-q6',
      question: 'What is a chord progression?',
      options: ['A single note', 'A sequence of chords', 'A vocal technique', 'An instrument'],
      correctAnswer: 1,
      explanation: 'A chord progression is a sequence of chords played in succession.'
    },
    {
      id: 'mock-q7',
      question: 'Which instrument family does the violin belong to?',
      options: ['Woodwind', 'Brass', 'Strings', 'Percussion'],
      correctAnswer: 2,
      explanation: 'The violin is a string instrument played with a bow.'
    },
    {
      id: 'mock-q8',
      question: 'What is the relative minor of C major?',
      options: ['A minor', 'E minor', 'G minor', 'D minor'],
      correctAnswer: 0,
      explanation: 'A minor is the relative minor of C major, sharing the same key signature.'
    },
    {
      id: 'mock-q9',
      question: 'How many lines does a standard musical staff have?',
      options: ['4', '5', '6', '8'],
      correctAnswer: 1,
      explanation: 'A standard musical staff consists of 5 horizontal lines.'
    },
    {
      id: 'mock-q10',
      question: 'What does "allegro" indicate in terms of tempo?',
      options: ['Very slow', 'Moderate', 'Fast', 'Very fast'],
      correctAnswer: 2,
      explanation: 'Allegro indicates a fast, lively tempo.'
    },
    // Additional questions for higher tiers
    {
      id: 'mock-q11',
      question: 'What is a dominant 7th chord built on G?',
      options: ['G-B-D-F', 'G-B-D-F#', 'G-A-D-F', 'G-C-E-F'],
      correctAnswer: 0,
      explanation: 'A G dominant 7th chord consists of G-B-D-F.'
    },
    {
      id: 'mock-q12',
      question: 'In which key does a piece with 3 sharps belong?',
      options: ['D major', 'A major', 'E major', 'B major'],
      correctAnswer: 1,
      explanation: 'A key signature with 3 sharps (F#, C#, G#) indicates A major.'
    }
  ];

  // Filter questions based on tier requirements
  let availableQuestions = baseQuestions;
  
  if (tier === 'free') {
    availableQuestions = baseQuestions.slice(0, 8); // Basic questions only
  } else if (tier === 'basic') {
    availableQuestions = baseQuestions.slice(0, 10); // Include intermediate
  }
  // Premium and professional get all questions

  // Generate additional mock questions if needed
  while (availableQuestions.length < count) {
    availableQuestions.push({
      id: `mock-generated-${availableQuestions.length}`,
      question: 'What is the best way to improve musical skills?',
      options: ['Practice regularly', 'Listen to music', 'Study theory', 'All of the above'],
      correctAnswer: 3,
      explanation: 'Consistent practice, active listening, and theory study all contribute to musical improvement.'
    });
  }

  return shuffleArray(availableQuestions).slice(0, count);
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

// Mock functions that would normally interact with a backend
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
