import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  fetchQuizzes, 
  fetchUserQuizAttempts, 
  fetchQuestionsByTier,
  fetchRandomQuestionsByTier,
  Quiz, 
  QuizAttempt,
  QuizQuestion,
  toggleQuestionRotation,
  isRotationEnabled
} from '@/services/quizService';

export const useQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await fetchQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  return { quizzes, loading, error, refetch: loadQuizzes };
};

export const useUserQuizProgress = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadAttempts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await fetchUserQuizAttempts(user.id);
      setAttempts(data);
    } catch (err) {
      console.error('Error loading quiz attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, [user]);

  const getCompletedQuizIds = () => {
    return attempts
      .filter(attempt => attempt.completed)
      .map(attempt => attempt.quiz_id);
  };

  const getQuizScore = (quizId: string) => {
    const attempt = attempts.find(a => a.quiz_id === quizId && a.completed);
    return attempt?.score || 0;
  };

  return { 
    attempts, 
    loading, 
    getCompletedQuizIds, 
    getQuizScore,
    refetch: loadAttempts
  };
};

export const useQuestionRotation = () => {
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    setRotationEnabled(isRotationEnabled());
  }, []);

  const toggleRotation = () => {
    const newState = !rotationEnabled;
    setRotationEnabled(newState);
    toggleQuestionRotation(newState);
  };

  const getQuestionsForTier = async (
    tier: string, 
    useRotation: boolean = rotationEnabled
  ): Promise<QuizQuestion[]> => {
    return useRotation 
      ? await fetchQuestionsByTier(tier, true)
      : await fetchRandomQuestionsByTier(tier);
  };

  return {
    rotationEnabled,
    toggleRotation,
    getQuestionsForTier
  };
};

export const useDynamicQuiz = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { rotationEnabled, getQuestionsForTier } = useQuestionRotation();

  const loadQuestions = async (forceRefresh: boolean = false) => {
    if (!user && !forceRefresh) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tier = user?.subscriptionTier || 'free';
      const questionsData = await getQuestionsForTier(tier, rotationEnabled);
      setQuestions(questionsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load questions';
      setError(errorMessage);
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [user, rotationEnabled]);

  const refreshQuestions = () => loadQuestions(true);

  return {
    questions,
    loading,
    error,
    refreshQuestions,
    rotationEnabled
  };
};