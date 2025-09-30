import { motion } from "framer-motion";
import {
  Book,
  Check,
  Clock,
  Home,
  Pause,
  Play,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "../../store/appStore";
import {
  SpacedRepetitionManager,
  type ReviewResult,
} from "../../utils/spacedRepetition";

const StudyMode = () => {
  const {
    storedVocabularyCards,
    studyCards,
    currentStudySession,
    reviewCard,
    startStudySession,
    endStudySession,
    getStudyStats,
  } = useAppStore();

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionCards, setSessionCards] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  const studyStats = getStudyStats();

  // Initialize study session
  useEffect(() => {
    if (storedVocabularyCards.length > 0 && !currentStudySession) {
      const dueCards = SpacedRepetitionManager.getDueCards(
        storedVocabularyCards,
        20
      );
      if (dueCards.length > 0) {
        setSessionCards(dueCards);
        startStudySession();
      }
    }
  }, [storedVocabularyCards, currentStudySession, startStudySession]);

  // Update session cards when study cards change
  useEffect(() => {
    if (studyCards.length > 0 && currentStudySession) {
      setSessionCards(studyCards.slice(0, 20));
      setCurrentCardIndex(0);
      setShowAnswer(false);
    }
  }, [studyCards, currentStudySession]);

  const handleCardReview = (quality: number, correct: boolean) => {
    const currentCard = sessionCards[currentCardIndex];
    if (currentCard) {
      const result: ReviewResult = { quality, correct };
      reviewCard(currentCard.id, result);

      // Move to next card or end session if done
      if (currentCardIndex >= sessionCards.length - 1) {
        // Session complete
        setTimeout(() => {
          endStudySession();
          setSessionCards([]);
        }, 1000);
      } else {
        setCurrentCardIndex((prev) => prev + 1);
        setShowAnswer(false);
      }
    }
  };

  const currentCard = sessionCards[currentCardIndex];
  const progress =
    sessionCards.length > 0
      ? ((currentCardIndex + 1) / sessionCards.length) * 100
      : 0;

  if (storedVocabularyCards.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
            <Book className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 font-serif">
            Ready to Study?
          </h1>
          <p className="text-white/60 text-lg mb-8">
            You need vocabulary cards to start studying. Generate some cards
            from Latin texts first!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/library"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Book className="w-5 h-5" />
              <span>Browse Texts</span>
            </a>
            <a
              href="/app"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Target className="w-5 h-5" />
              <span>Analyze Text</span>
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (sessionCards.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
            <Clock className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 font-serif">
            No Cards Due
          </h1>
          <p className="text-white/60 text-lg mb-8">
            Great job! All your cards are up to date. Come back later for your
            next review session.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/progress"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <TrendingUp className="w-5 h-5" />
              <span>View Progress</span>
            </a>
            <a
              href="/app"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Book className="w-5 h-5" />
              <span>Add More Cards</span>
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-serif">
            Study Session
          </h1>
          <p className="text-white/60 text-lg">
            Review your vocabulary with spaced repetition
          </p>
        </div>

        {/* Session Stats */}
        {currentStudySession && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {currentStudySession.cardsReviewed}
              </div>
              <div className="text-sm text-white/60">Reviewed</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <div className="text-2xl font-bold text-green-400">
                {Math.round(currentStudySession.accuracy * 100)}%
              </div>
              <div className="text-sm text-white/60">Accuracy</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {sessionCards.length - currentCardIndex}
              </div>
              <div className="text-sm text-white/60">Remaining</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {Math.round((Date.now() - currentStudySession.date) / 60000)}m
              </div>
              <div className="text-sm text-white/60">Time</div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">
              Card {currentCardIndex + 1} of {sessionCards.length}
            </span>
            <span className="text-white/60 text-sm">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Study Card */}
        {currentCard && (
          <motion.div
            key={`${currentCard.id}-${currentCardIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 rounded-xl p-8 border border-white/10 min-h-[400px] flex flex-col justify-center"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    currentCard.repetitions === 0
                      ? "bg-green-400"
                      : currentCard.repetitions < 3
                      ? "bg-yellow-400"
                      : "bg-blue-400"
                  }`}
                />
                <span className="text-white/60 text-sm">
                  {currentCard.repetitions === 0
                    ? "New"
                    : currentCard.repetitions < 3
                    ? "Learning"
                    : "Review"}
                </span>
              </div>
              <div className="text-white/60 text-sm">
                Due in{" "}
                {Math.ceil(
                  (currentCard.nextReview - Date.now()) / (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </div>
            </div>

            {/* Question Side */}
            {!showAnswer ? (
              <div className="text-center space-y-8">
                <div className="text-4xl sm:text-5xl font-bold text-white mb-6 font-serif">
                  {currentCard.word}
                </div>
                <p className="text-white/70 text-xl mb-8">
                  What does this word mean?
                </p>
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-lg"
                >
                  Show Answer
                </button>
              </div>
            ) : (
              /* Answer Side */
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-4 font-serif">
                    {currentCard.word}
                  </div>
                  <div className="text-xl text-blue-300 mb-6">
                    {currentCard.meaning}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-white mb-2">Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/60">Part of Speech:</span>
                          <span className="text-white">
                            {currentCard.partOfSpeech}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Lemma:</span>
                          <span className="text-white">
                            {currentCard.lemma}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Frequency:</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              currentCard.frequency === "common"
                                ? "bg-green-500/20 text-green-300"
                                : currentCard.frequency === "uncommon"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {currentCard.frequency}
                          </span>
                        </div>
                      </div>
                    </div>

                    {currentCard.etymology && (
                      <div>
                        <h3 className="font-semibold text-white mb-2">
                          Etymology
                        </h3>
                        <p className="text-white/80 text-sm">
                          {currentCard.etymology}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {currentCard.usageExamples.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-white mb-2">
                          Usage Examples
                        </h3>
                        <div className="space-y-2">
                          {currentCard.usageExamples
                            .slice(0, 2)
                            .map((example, idx) => (
                              <p
                                key={idx}
                                className="text-white/80 text-sm italic"
                              >
                                "{example}"
                              </p>
                            ))}
                        </div>
                      </div>
                    )}

                    {currentCard.mnemonicDevice && (
                      <div>
                        <h3 className="font-semibold text-white mb-2">
                          Memory Aid
                        </h3>
                        <p className="text-white/80 text-sm">
                          {currentCard.mnemonicDevice}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Buttons */}
                <div className="flex justify-center space-x-4 pt-6">
                  <button
                    onClick={() => handleCardReview(1, false)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <X className="w-5 h-5" />
                    <span>Hard</span>
                  </button>
                  <button
                    onClick={() => handleCardReview(3, true)}
                    className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Clock className="w-5 h-5" />
                    <span>Good</span>
                  </button>
                  <button
                    onClick={() => handleCardReview(5, true)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Easy</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Session Complete */}
        {currentCardIndex >= sessionCards.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
              <Target className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 font-serif">
              Session Complete! 🎉
            </h2>
            <p className="text-white/60 text-lg mb-8">
              Great job! You've completed your study session. Come back tomorrow
              for more reviews.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/progress"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <TrendingUp className="w-5 h-5" />
                <span>View Progress</span>
              </a>
              <a
                href="/study"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Study Again</span>
              </a>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        {currentCardIndex < sessionCards.length && (
          <div className="flex justify-center space-x-4">
            <a
              href="/"
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </a>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                isPaused
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isPaused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudyMode;
