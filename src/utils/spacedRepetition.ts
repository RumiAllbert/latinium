/**
 * Spaced Repetition Algorithm for Latinium.ai
 * Implements SM-2 algorithm for optimal vocabulary learning
 */

import type { StoredVocabularyCard } from './storage';

export interface ReviewResult {
  quality: number; // 0-5, where 5 is perfect recall
  correct: boolean;
}

export interface StudyCard extends StoredVocabularyCard {
  isDue: boolean;
  daysUntilDue: number;
  priority: number; // Higher = more urgent
}

export class SpacedRepetitionManager {
  // SM-2 Algorithm constants
  private static readonly EASY_BONUS = 1.3;
  private static readonly HARD_MULTIPLIER = 1.2;
  private static readonly MIN_EASE_FACTOR = 1.3;
  private static readonly MAX_INTERVAL = 36500; // ~100 years

  /**
   * Calculate next review date and update card stats based on review quality
   */
  static updateCard(card: StoredVocabularyCard, result: ReviewResult): StoredVocabularyCard {
    const { quality, correct } = result;

    // Update basic stats
    const updatedCard = {
      ...card,
      lastReviewed: Date.now(),
      timesCorrect: correct ? card.timesCorrect + 1 : card.timesCorrect,
      timesIncorrect: correct ? card.timesIncorrect : card.timesIncorrect + 1,
    };

    // Update spaced repetition data
    if (correct) {
      updatedCard.repetitions += 1;

      if (updatedCard.repetitions === 1) {
        updatedCard.interval = 1;
      } else if (updatedCard.repetitions === 2) {
        updatedCard.interval = 6;
      } else {
        // Calculate new interval using SM-2 algorithm
        let newInterval = Math.round(updatedCard.interval * updatedCard.easeFactor);

        // Apply quality modifier
        if (quality >= 3) {
          // Good or better recall
          if (quality === 3) {
            newInterval *= SpacedRepetitionManager.HARD_MULTIPLIER;
          } else if (quality >= 4) {
            newInterval *= SpacedRepetitionManager.EASY_BONUS;
          }
        } else {
          // Poor recall - reset
          newInterval = 1;
          updatedCard.repetitions = 0;
        }

        // Cap maximum interval
        updatedCard.interval = Math.min(newInterval, SpacedRepetitionManager.MAX_INTERVAL);
      }

      // Update ease factor
      updatedCard.easeFactor = Math.max(
        SpacedRepetitionManager.MIN_EASE_FACTOR,
        updatedCard.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      );
    } else {
      // Incorrect answer - reset progress
      updatedCard.repetitions = 0;
      updatedCard.interval = 1;
      updatedCard.easeFactor = Math.max(
        SpacedRepetitionManager.MIN_EASE_FACTOR,
        updatedCard.easeFactor - 0.2
      );
    }

    // Set next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + updatedCard.interval);
    updatedCard.nextReview = nextReviewDate.getTime();

    return updatedCard;
  }

  /**
   * Get cards that are due for review
   */
  static getDueCards(cards: StoredVocabularyCard[], limit?: number): StudyCard[] {
    const now = Date.now();
    const dueCards = cards
      .map(card => {
        const isDue = card.nextReview <= now;
        const daysUntilDue = Math.ceil((card.nextReview - now) / (1000 * 60 * 60 * 24));

        // Priority calculation: due cards get higher priority, overdue cards even higher
        let priority = 0;
        if (isDue) {
          priority = daysUntilDue < 0 ? 100 + Math.abs(daysUntilDue) : 50;
        } else {
          priority = Math.max(0, 25 - daysUntilDue);
        }

        return {
          ...card,
          isDue,
          daysUntilDue,
          priority,
        } as StudyCard;
      })
      .filter(card => card.isDue)
      .sort((a, b) => {
        // Sort by priority (highest first), then by next review date (oldest first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.nextReview - b.nextReview;
      });

    return limit ? dueCards.slice(0, limit) : dueCards;
  }

  /**
   * Get cards for new study session (not yet learned)
   */
  static getNewCards(cards: StoredVocabularyCard[], limit: number = 20): StoredVocabularyCard[] {
    return cards
      .filter(card => card.repetitions === 0)
      .sort((a, b) => a.dateAdded - b.dateAdded)
      .slice(0, limit);
  }

  /**
   * Get study statistics
   */
  static getStudyStats(cards: StoredVocabularyCard[]) {
    const now = Date.now();
    const totalCards = cards.length;

    const dueCards = cards.filter(card => card.nextReview <= now);
    const newCards = cards.filter(card => card.repetitions === 0);
    const learningCards = cards.filter(card => card.repetitions > 0 && card.nextReview <= now);

    const avgEaseFactor = totalCards > 0
      ? cards.reduce((sum, card) => sum + card.easeFactor, 0) / totalCards
      : 0;

    const accuracyRate = cards.length > 0
      ? cards.reduce((sum, card) => sum + (card.timesCorrect / (card.timesCorrect + card.timesIncorrect || 1)), 0) / cards.length
      : 0;

    return {
      totalCards,
      dueCards: dueCards.length,
      newCards: newCards.length,
      learningCards: learningCards.length,
      avgEaseFactor: Math.round(avgEaseFactor * 100) / 100,
      accuracyRate: Math.round(accuracyRate * 100) / 100,
    };
  }

  /**
   * Generate study plan for a session
   */
  static generateStudyPlan(cards: StoredVocabularyCard[], sessionDuration: number = 30): {
    newCards: StoredVocabularyCard[];
    reviewCards: StudyCard[];
    estimatedTime: number;
  } {
    const newCards = this.getNewCards(cards, 10); // Max 10 new cards per session
    const reviewCards = this.getDueCards(cards, 20); // Max 20 review cards per session

    // Estimate time: ~1 minute per new card, ~30 seconds per review card
    const estimatedTime = (newCards.length * 60) + (reviewCards.length * 30);

    return {
      newCards,
      reviewCards,
      estimatedTime: Math.min(estimatedTime, sessionDuration * 60), // Cap at session duration
    };
  }
}

