/**
 * Local Storage Management for Latinium.ai
 * Provides persistent storage for vocabulary cards, progress, and user data
 */

export interface StoredVocabularyCard {
  id: string;
  word: string;
  lemma: string;
  partOfSpeech: string;
  meaning: string;
  etymology?: string;
  relatedWords: string[];
  usageExamples: string[];
  mnemonicDevice?: string;
  frequency: 'common' | 'uncommon' | 'rare';
  // Spaced repetition data
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastReviewed?: number;
  timesCorrect: number;
  timesIncorrect: number;
  // User data
  dateAdded: number;
  sourceText?: string;
  tags: string[];
  notes?: string;
}

export interface StoredText {
  id: string;
  title: string;
  content: string;
  language: string;
  source?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dateAdded: number;
  tags: string[];
  isFavorite: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: boolean;
    autoReview: boolean;
  };
  stats: {
    totalCards: number;
    cardsStudied: number;
    currentStreak: number;
    longestStreak: number;
    totalStudyTime: number; // in minutes
    accuracyRate: number;
    level: number;
    xp: number;
  };
  achievements: string[];
  createdAt: number;
  lastActive: number;
}

export interface StudySession {
  id: string;
  date: number;
  duration: number; // in minutes
  cardsReviewed: number;
  correctAnswers: number;
  accuracy: number;
  cardsAdded: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const STORAGE_KEYS = {
  VOCABULARY: 'latinium_vocabulary',
  TEXTS: 'latinium_texts',
  PROFILE: 'latinium_profile',
  SESSIONS: 'latinium_sessions',
  ACHIEVEMENTS: 'latinium_achievements',
  SETTINGS: 'latinium_settings',
} as const;

class StorageManager {
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Vocabulary Management
  getVocabularyCards(): StoredVocabularyCard[] {
    if (!this.isStorageAvailable()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VOCABULARY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveVocabularyCard(card: Omit<StoredVocabularyCard, 'id' | 'dateAdded' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReview' | 'timesCorrect' | 'timesIncorrect'>): StoredVocabularyCard {
    const cards = this.getVocabularyCards();
    const newCard: StoredVocabularyCard = {
      ...card,
      id: `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dateAdded: Date.now(),
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReview: Date.now(),
      timesCorrect: 0,
      timesIncorrect: 0,
    };

    cards.push(newCard);
    this.saveVocabularyCards(cards);
    return newCard;
  }

  saveVocabularyCards(cards: StoredVocabularyCard[]): void {
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(cards));
    } catch (error) {
      console.error('Failed to save vocabulary cards:', error);
    }
  }

  updateVocabularyCard(cardId: string, updates: Partial<StoredVocabularyCard>): void {
    const cards = this.getVocabularyCards();
    const index = cards.findIndex(card => card.id === cardId);
    if (index >= 0) {
      cards[index] = { ...cards[index], ...updates };
      this.saveVocabularyCards(cards);
    }
  }

  deleteVocabularyCard(cardId: string): void {
    const cards = this.getVocabularyCards().filter(card => card.id !== cardId);
    this.saveVocabularyCards(cards);
  }

  // Text Management
  getStoredTexts(): StoredText[] {
    if (!this.isStorageAvailable()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEXTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveText(text: Omit<StoredText, 'id' | 'dateAdded'>): StoredText {
    const texts = this.getStoredTexts();
    const newText: StoredText = {
      ...text,
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dateAdded: Date.now(),
    };

    texts.push(newText);
    this.saveStoredTexts(texts);
    return newText;
  }

  saveStoredTexts(texts: StoredText[]): void {
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TEXTS, JSON.stringify(texts));
    } catch (error) {
      console.error('Failed to save texts:', error);
    }
  }

  updateText(textId: string, updates: Partial<StoredText>): void {
    const texts = this.getStoredTexts();
    const index = texts.findIndex(text => text.id === textId);
    if (index >= 0) {
      texts[index] = { ...texts[index], ...updates };
      this.saveStoredTexts(texts);
    }
  }

  deleteText(textId: string): void {
    const texts = this.getStoredTexts().filter(text => text.id !== textId);
    this.saveStoredTexts(texts);
  }

  // Profile Management
  getProfile(): UserProfile | null {
    if (!this.isStorageAvailable()) return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveProfile(profile: UserProfile): void {
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }

  // Study Sessions
  getStudySessions(): StudySession[] {
    if (!this.isStorageAvailable()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveStudySession(session: StudySession): void {
    const sessions = this.getStudySessions();
    sessions.push(session);
    // Keep only last 100 sessions to prevent storage bloat
    if (sessions.length > 100) {
      sessions.splice(0, sessions.length - 100);
    }
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save study session:', error);
    }
  }

  // Settings
  getSettings(): Record<string, any> {
    if (!this.isStorageAvailable()) return {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  saveSettings(settings: Record<string, any>): void {
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  // Export/Import
  exportData(): string {
    const data = {
      vocabulary: this.getVocabularyCards(),
      texts: this.getStoredTexts(),
      profile: this.getProfile(),
      sessions: this.getStudySessions(),
      settings: this.getSettings(),
      exportedAt: Date.now(),
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.vocabulary) this.saveVocabularyCards(data.vocabulary);
      if (data.texts) this.saveStoredTexts(data.texts);
      if (data.profile) this.saveProfile(data.profile);
      if (data.sessions) {
        const sessions = this.getStudySessions().concat(data.sessions);
        if (sessions.length > 100) {
          sessions.splice(0, sessions.length - 100);
        }
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      }
      if (data.settings) this.saveSettings(data.settings);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    if (!this.isStorageAvailable()) return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const storage = new StorageManager();

