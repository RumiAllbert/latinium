import { create } from 'zustand';
import type { AnalysisResult } from '../types/AnalysisResult';
import {
    analyzeLatin,
    generateGraphData,
    generateParsingExercises,
    generateProsodyAnalysis,
    generateQuiz,
    generateTutoring,
    generateVocabularyCards
} from '../utils/directGeminiApi';
import { SpacedRepetitionManager, type ReviewResult, type StudyCard } from '../utils/spacedRepetition';
import { storage, type StoredText, type StoredVocabularyCard, type StudySession, type UserProfile } from '../utils/storage';

type AnalysisState = 'idle' | 'analyzing' | 'success' | 'error';
type FeatureState = 'idle' | 'loading' | 'loaded' | 'error';

interface QuizData {
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
}

interface TutoringData {
  steps: Array<{
    title: string;
    question: string;
    hint?: string;
    expectedAnswer?: string;
    explanation?: string;
  }>;
}

interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label: string;
  }>;
}

interface ProsodyData {
  scansion: Array<{
    word: string;
    syllables: Array<{
      syllable: string;
      length: 'long' | 'short' | 'anceps';
      stress: boolean;
    }>;
  }>;
  meter: string;
  analysis: string;
}

interface VocabularyData {
  cards: Array<{
    word: string;
    lemma: string;
    partOfSpeech: string;
    meaning: string;
    etymology?: string;
    relatedWords: string[];
    usageExamples: string[];
    mnemonicDevice?: string;
    frequency: 'common' | 'uncommon' | 'rare';
  }>;
}

interface ParsingData {
  exercises: Array<{
    type: 'drag-to-order' | 'identify-function' | 'transform-sentence';
    instruction: string;
    sentence: string;
    correctOrder?: string[];
    elements?: Array<{
      word: string;
      function: string;
      explanation: string;
    }>;
    transformation?: {
      from: string;
      to: string;
      explanation: string;
    };
    difficulty: 'easy' | 'medium' | 'hard';
    hint?: string;
  }>;
}

interface AppState {
  analysisResult: AnalysisResult | null;
  analysisState: AnalysisState;
  error: string | null;
  rateLimitError: boolean;
  hoveredWordIndex: number | null;
  inspectedWordIndex: number | null;

  // Feature-specific state
  quizData: QuizData | null;
  quizState: FeatureState;

  tutoringData: TutoringData | null;
  tutoringState: FeatureState;

  graphData: GraphData | null;
  graphState: FeatureState;

  prosodyData: ProsodyData | null;
  prosodyState: FeatureState;

  vocabularyData: VocabularyData | null;
  vocabularyState: FeatureState;

  parsingData: ParsingData | null;
  parsingState: FeatureState;

  currentText: string;

  // Storage-related state
  storedVocabularyCards: StoredVocabularyCard[];
  storedTexts: StoredText[];
  userProfile: UserProfile | null;
  currentStudySession: StudySession | null;
  studyCards: StudyCard[];
  isStudyMode: boolean;

  // Actions
  analyzeText: (text: string) => Promise<void>;
  setCurrentText: (text: string) => void;
  generateQuiz: () => Promise<void>;
  generateTutoring: () => Promise<void>;
  generateGraph: () => Promise<void>;
  generateProsody: () => Promise<void>;
  generateVocabulary: () => Promise<void>;
  generateParsingExercises: () => Promise<void>;

  setHoveredWordIndex: (index: number | null) => void;
  setInspectedWordIndex: (index: number | null) => void;
  hoverWordByLabel: (label: string) => void;
  inspectWordByLabel: (label: string) => void;
  reset: () => void;

  // Storage actions
  loadStoredData: () => void;
  saveVocabularyCard: (card: Omit<StoredVocabularyCard, 'id' | 'dateAdded' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReview' | 'timesCorrect' | 'timesIncorrect'>) => StoredVocabularyCard;
  updateVocabularyCard: (cardId: string, updates: Partial<StoredVocabularyCard>) => void;
  deleteVocabularyCard: (cardId: string) => void;
  saveText: (text: Omit<StoredText, 'id' | 'dateAdded'>) => StoredText;
  updateText: (textId: string, updates: Partial<StoredText>) => void;
  deleteText: (textId: string) => void;
  updateProfile: (profile: UserProfile) => void;

  // Study session actions
  startStudySession: () => void;
  endStudySession: () => void;
  reviewCard: (cardId: string, result: ReviewResult) => void;
  getStudyStats: () => ReturnType<typeof SpacedRepetitionManager.getStudyStats>;
  getStudySessions: () => StudySession[];

  // Import/Export
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  analysisResult: null,
  analysisState: 'idle',
  error: null,
  rateLimitError: false,
  hoveredWordIndex: null,
  inspectedWordIndex: null,

  // Feature-specific state
  quizData: null,
  quizState: 'idle',
  tutoringData: null,
  tutoringState: 'idle',
  graphData: null,
  graphState: 'idle',
  prosodyData: null,
  prosodyState: 'idle',
  vocabularyData: null,
  vocabularyState: 'idle',
  parsingData: null,
  parsingState: 'idle',
  currentText: '',

  // Storage-related state
  storedVocabularyCards: [],
  storedTexts: [],
  userProfile: null,
  currentStudySession: null,
  studyCards: [],
  isStudyMode: false,

  analyzeText: async (text: string) => {
    console.log("`analyzeText` action triggered in store with:", text);
    set({
      analysisState: 'analyzing',
      error: null,
      analysisResult: null,
      hoveredWordIndex: null,
      inspectedWordIndex: null,
      currentText: text
    });

    const apiKey = import.meta.env.PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      const errorMessage = "Gemini API key is not configured. Please set PUBLIC_GEMINI_API_KEY in your environment.";
      console.error(errorMessage);
      set({ error: errorMessage, analysisState: 'error' });
      return;
    }

    try {
      const { result, isMockData, rateLimited } = await analyzeLatin(text);

      if (rateLimited) {
        const rateLimitMessage = 'Rate limit exceeded. Please wait for the reset timer or try again later.';
        console.warn(rateLimitMessage);
        set({
          error: rateLimitMessage,
          analysisState: 'error',
          rateLimitError: true
        });
        return;
      }

      if (isMockData) {
        console.warn("Displaying mock data as a fallback.");
      }
      console.log('Setting analysis result:', { result, wordCount: result.words?.length, isMockData });
      console.log('First few words:', result.words?.slice(0, 3));
      set({ analysisResult: result, analysisState: 'success', rateLimitError: false });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error("Analysis failed:", errorMessage);
      set({ error: errorMessage, analysisState: 'error', rateLimitError: false });
    }
  },

  setCurrentText: (text: string) => {
    set({ currentText: text });
  },

  setHoveredWordIndex: (index: number | null) => {
    set({ hoveredWordIndex: index });
  },

  setInspectedWordIndex: (index: number | null) => {
    set({ inspectedWordIndex: index });
  },
  
  hoverWordByLabel: (label: string) => {
    const { analysisResult } = get();
    if (!analysisResult?.words) return;
    const norm = (s: string) => s.toLowerCase().replace(/[_\s]+/g, ' ').trim();
    const target = norm(label);
    const idx = analysisResult.words.findIndex((w) => {
      const w1 = norm(w.word || '');
      const w2 = norm(w.lemma || '');
      return w1 === target || w2 === target;
    });
    if (idx >= 0) set({ hoveredWordIndex: idx });
  },

  inspectWordByLabel: (label: string) => {
    const { analysisResult } = get();
    if (!analysisResult?.words) return;
    const norm = (s: string) => s.toLowerCase().replace(/[_\s]+/g, ' ').trim();
    const target = norm(label);
    const idx = analysisResult.words.findIndex((w) => {
      const w1 = norm(w.word || '');
      const w2 = norm(w.lemma || '');
      return w1 === target || w2 === target;
    });
    if (idx >= 0) set({ inspectedWordIndex: idx });
  },
  
  reset: () => {
    set({
      analysisResult: null,
      analysisState: 'idle',
      error: null,
      hoveredWordIndex: null,
      inspectedWordIndex: null,
      currentText: '',
      quizData: null,
      quizState: 'idle',
      tutoringData: null,
      tutoringState: 'idle',
      graphData: null,
      graphState: 'idle',
      prosodyData: null,
      prosodyState: 'idle',
      vocabularyData: null,
      vocabularyState: 'idle',
      parsingData: null,
      parsingState: 'idle',
    });
  },

  generateQuiz: async () => {
    const { currentText } = get();
    if (!currentText) return;

    set({ quizState: 'loading', quizData: null });

    try {
      const quizData = await generateQuiz(currentText);
      set({ quizData, quizState: 'loaded' });
    } catch (error) {
      console.error('Error generating quiz:', error);
      set({ quizState: 'error' });
    }
  },

  generateTutoring: async () => {
    const { currentText } = get();
    if (!currentText) return;

    set({ tutoringState: 'loading', tutoringData: null });

    try {
      const tutoringData = await generateTutoring(currentText);
      set({ tutoringData, tutoringState: 'loaded' });
    } catch (error) {
      console.error('Error generating tutoring content:', error);
      set({ tutoringState: 'error' });
    }
  },

  generateGraph: async () => {
    const { currentText } = get();
    if (!currentText) return;

    set({ graphState: 'loading', graphData: null });

    try {
      const graphData = await generateGraphData(currentText);
      set({ graphData, graphState: 'loaded' });
    } catch (error) {
      console.error('Error generating graph data:', error);
      set({ graphState: 'error' });
    }
  },

  generateProsody: async () => {
    const { currentText } = get();
    if (!currentText) return;

    set({ prosodyState: 'loading', prosodyData: null });

    try {
      const prosodyData = await generateProsodyAnalysis(currentText);
      set({ prosodyData, prosodyState: 'loaded' });
    } catch (error) {
      console.error('Error generating prosody analysis:', error);
      set({ prosodyState: 'error' });
    }
  },

  generateVocabulary: async () => {
    const { currentText } = get();
    if (!currentText) return;

    set({ vocabularyState: 'loading', vocabularyData: null });

    try {
      const vocabularyData = await generateVocabularyCards(currentText);
      set({ vocabularyData, vocabularyState: 'loaded' });
    } catch (error) {
      console.error('Error generating vocabulary cards:', error);
      set({ vocabularyState: 'error' });
    }
  },

  generateParsingExercises: async () => {
    const { currentText } = get();
    if (!currentText) return;

    set({ parsingState: 'loading', parsingData: null });

    try {
      const parsingData = await generateParsingExercises(currentText);
      set({ parsingData, parsingState: 'loaded' });
    } catch (error) {
      console.error('Error generating parsing exercises:', error);
      set({ parsingState: 'error' });
    }
  },

  // Storage actions
  loadStoredData: () => {
    const vocabularyCards = storage.getVocabularyCards();
    const texts = storage.getStoredTexts();
    const profile = storage.getProfile();

    set({
      storedVocabularyCards: vocabularyCards,
      storedTexts: texts,
      userProfile: profile,
    });

    // Update study cards based on stored vocabulary
    const studyCards = SpacedRepetitionManager.getDueCards(vocabularyCards);
    set({ studyCards });
  },

  saveVocabularyCard: (cardData) => {
    const card = storage.saveVocabularyCard(cardData);
    const cards = storage.getVocabularyCards();
    const studyCards = SpacedRepetitionManager.getDueCards(cards);

    set({
      storedVocabularyCards: cards,
      studyCards,
    });

    return card;
  },

  updateVocabularyCard: (cardId, updates) => {
    storage.updateVocabularyCard(cardId, updates);
    const cards = storage.getVocabularyCards();
    const studyCards = SpacedRepetitionManager.getDueCards(cards);

    set({
      storedVocabularyCards: cards,
      studyCards,
    });
  },

  deleteVocabularyCard: (cardId) => {
    storage.deleteVocabularyCard(cardId);
    const cards = storage.getVocabularyCards();
    const studyCards = SpacedRepetitionManager.getDueCards(cards);

    set({
      storedVocabularyCards: cards,
      studyCards,
    });
  },

  saveText: (textData) => {
    const text = storage.saveText(textData);
    const texts = storage.getStoredTexts();

    set({ storedTexts: texts });
    return text;
  },

  updateText: (textId, updates) => {
    storage.updateText(textId, updates);
    const texts = storage.getStoredTexts();
    set({ storedTexts: texts });
  },

  deleteText: (textId) => {
    storage.deleteText(textId);
    const texts = storage.getStoredTexts();
    set({ storedTexts: texts });
  },

  updateProfile: (profile) => {
    storage.saveProfile(profile);
    set({ userProfile: profile });
  },

  // Study session actions
  startStudySession: () => {
    const session: StudySession = {
      id: `session_${Date.now()}`,
      date: Date.now(),
      duration: 0,
      cardsReviewed: 0,
      correctAnswers: 0,
      accuracy: 0,
      cardsAdded: 0,
    };

    set({
      currentStudySession: session,
      isStudyMode: true,
    });
  },

  endStudySession: () => {
    const { currentStudySession, storedVocabularyCards } = get();
    if (!currentStudySession) return;

    const completedSession = {
      ...currentStudySession,
      duration: Math.round((Date.now() - currentStudySession.date) / 60000), // Convert to minutes
    };

    storage.saveStudySession(completedSession);

    // Update profile stats
    const profile = storage.getProfile();
    if (profile) {
      const updatedProfile = {
        ...profile,
        stats: {
          ...profile.stats,
          totalStudyTime: profile.stats.totalStudyTime + completedSession.duration,
          cardsStudied: profile.stats.cardsStudied + completedSession.cardsReviewed,
          accuracyRate: completedSession.cardsReviewed > 0
            ? (profile.stats.accuracyRate * profile.stats.cardsStudied + completedSession.accuracy * completedSession.cardsReviewed) / (profile.stats.cardsStudied + completedSession.cardsReviewed)
            : profile.stats.accuracyRate,
        },
        lastActive: Date.now(),
      };

      storage.saveProfile(updatedProfile);
      set({ userProfile: updatedProfile });
    }

    set({
      currentStudySession: null,
      isStudyMode: false,
    });
  },

  reviewCard: (cardId, result) => {
    const { storedVocabularyCards, currentStudySession } = get();

    // Update card in storage
    const cardIndex = storedVocabularyCards.findIndex(card => card.id === cardId);
    if (cardIndex >= 0) {
      const updatedCard = SpacedRepetitionManager.updateCard(storedVocabularyCards[cardIndex], result);
      storage.updateVocabularyCard(cardId, updatedCard);

      // Update local state
      const updatedCards = [...storedVocabularyCards];
      updatedCards[cardIndex] = updatedCard;

      // Update study cards
      const studyCards = SpacedRepetitionManager.getDueCards(updatedCards);

      // Update session stats if active
      if (currentStudySession) {
        const updatedSession = {
          ...currentStudySession,
          cardsReviewed: currentStudySession.cardsReviewed + 1,
          correctAnswers: currentStudySession.correctAnswers + (result.correct ? 1 : 0),
          accuracy: (currentStudySession.correctAnswers + (result.correct ? 1 : 0)) / (currentStudySession.cardsReviewed + 1),
        };

        set({
          storedVocabularyCards: updatedCards,
          studyCards,
          currentStudySession: updatedSession,
        });
      } else {
        set({
          storedVocabularyCards: updatedCards,
          studyCards,
        });
      }
    }
  },

  getStudyStats: () => {
    const { storedVocabularyCards } = get();
    return SpacedRepetitionManager.getStudyStats(storedVocabularyCards);
  },

  getStudySessions: () => {
    return storage.getStudySessions();
  },

  // Import/Export
  exportData: () => {
    return storage.exportData();
  },

  importData: (jsonData) => {
    const success = storage.importData(jsonData);
    if (success) {
      // Reload data into store
      get().loadStoredData();
    }
    return success;
  },
}));
