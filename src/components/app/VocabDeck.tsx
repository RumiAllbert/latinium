import { AnimatePresence, motion } from "framer-motion";
import {
  Book,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "../../store/appStore";
import { type ReviewResult } from "../../utils/spacedRepetition";

const VocabDeck = () => {
  const {
    vocabularyData,
    vocabularyState,
    generateVocabulary,
    currentText,
    storedVocabularyCards,
    studyCards,
    reviewCard,
    saveVocabularyCard,
    startStudySession,
    endStudySession,
    currentStudySession,
    getStudyStats,
  } = useAppStore();

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [sessionCards, setSessionCards] = useState<any[]>([]);

  const studyStats = getStudyStats();

  // Initialize study mode cards when component mounts
  useEffect(() => {
    if (studyMode && studyCards.length > 0) {
      setSessionCards(studyCards.slice(0, 20)); // Start with up to 20 cards
    }
  }, [studyMode, studyCards]);

  // Handle vocabulary generation for current text
  const handleGenerateVocabulary = () => {
    if (currentText && vocabularyData?.cards) {
      // Save generated cards to storage
      vocabularyData.cards.forEach((card) => {
        saveVocabularyCard({
          word: card.word,
          lemma: card.lemma,
          partOfSpeech: card.partOfSpeech,
          meaning: card.meaning,
          etymology: card.etymology,
          relatedWords: card.relatedWords,
          usageExamples: card.usageExamples,
          mnemonicDevice: card.mnemonicDevice,
          frequency: card.frequency,
          tags: [],
          sourceText: currentText,
        });
      });
    } else {
      generateVocabulary();
    }
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  // Study mode handlers
  const startStudyMode = () => {
    if (storedVocabularyCards.length === 0) return;
    startStudySession();
    setStudyMode(true);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const endStudyMode = () => {
    endStudySession();
    setStudyMode(false);
    setSessionCards([]);
  };

  const nextStudyCard = () => {
    if (sessionCards.length > 0) {
      setCurrentCardIndex((prev) => (prev + 1) % sessionCards.length);
      setShowAnswer(false);
    }
  };

  const prevStudyCard = () => {
    if (sessionCards.length > 0) {
      setCurrentCardIndex(
        (prev) => (prev - 1 + sessionCards.length) % sessionCards.length
      );
      setShowAnswer(false);
    }
  };

  const handleCardReview = (quality: number, correct: boolean) => {
    const currentCard = sessionCards[currentCardIndex];
    if (currentCard) {
      const result: ReviewResult = { quality, correct };
      reviewCard(currentCard.id, result);
      nextStudyCard();
    }
  };

  // Current card logic
  const currentCard = studyMode
    ? sessionCards[currentCardIndex]
    : vocabularyData?.cards?.[currentCardIndex];

  const cardsToShow = studyMode ? sessionCards : vocabularyData?.cards || [];
  const isLoading = vocabularyState === "loading";

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "common":
        return "bg-green-500/30 text-green-200";
      case "uncommon":
        return "bg-yellow-500/30 text-yellow-200";
      case "rare":
        return "bg-red-500/30 text-red-200";
      default:
        return "bg-gray-500/30 text-gray-200";
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10">
      {/* Header with Study Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <Book className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white font-serif">
            Vocabulary Learning
          </h2>
        </div>

        {/* Study Mode Toggle */}
        <div className="flex items-center space-x-3">
          {storedVocabularyCards.length > 0 && (
            <button
              onClick={studyMode ? endStudyMode : startStudyMode}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                studyMode
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              <Target className="w-4 h-4" />
              <span>{studyMode ? "End Study" : "Start Study"}</span>
            </button>
          )}

          {currentText && (
            <button
              onClick={handleGenerateVocabulary}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Generate Cards</span>
            </button>
          )}
        </div>
      </div>

      {/* Study Statistics */}
      {storedVocabularyCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-black/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {studyStats.totalCards}
            </div>
            <div className="text-sm text-white/60">Total Cards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {studyStats.dueCards}
            </div>
            <div className="text-sm text-white/60">Due for Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {studyStats.newCards}
            </div>
            <div className="text-sm text-white/60">New Cards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {Math.round(studyStats.accuracyRate * 100)}%
            </div>
            <div className="text-sm text-white/60">Accuracy</div>
          </div>
        </div>
      )}

      {/* Study Mode Interface */}
      {studyMode && sessionCards.length > 0 ? (
        <div className="space-y-6">
          {/* Study Session Info */}
          {currentStudySession && (
            <div className="flex items-center justify-center space-x-6 p-3 bg-blue-500/20 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-300">
                  {currentStudySession.cardsReviewed}
                </div>
                <div className="text-sm text-blue-200">Reviewed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-300">
                  {Math.round(currentStudySession.accuracy * 100)}%
                </div>
                <div className="text-sm text-green-200">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-300">
                  {Math.round((Date.now() - currentStudySession.date) / 60000)}m
                </div>
                <div className="text-sm text-purple-200">Time</div>
              </div>
            </div>
          )}

          {/* Study Card */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {currentCard && (
                <motion.div
                  key={`${currentCard.id}-${currentCardIndex}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="bg-black/20 rounded-lg p-6 border border-white/10 min-h-[350px] flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-white/60">
                      Card {currentCardIndex + 1} of {sessionCards.length}
                    </span>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(
                        currentCard.frequency
                      )}`}
                    >
                      {currentCard.frequency}
                    </div>
                  </div>

                  {/* Question Side */}
                  {!showAnswer ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="text-3xl font-bold text-white mb-4 font-serif">
                        {currentCard.word}
                      </div>
                      <p className="text-white/70 mb-6 text-lg">
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
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-white mb-4 font-serif">
                        {currentCard.word}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-white mb-2">
                            Meaning
                          </h3>
                          <p className="text-white/90 text-lg">
                            {currentCard.meaning}
                          </p>
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
                      </div>

                      {/* Review Buttons */}
                      <div className="flex justify-center space-x-3 mt-6">
                        <button
                          onClick={() => handleCardReview(1, false)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Hard</span>
                        </button>
                        <button
                          onClick={() => handleCardReview(3, true)}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Good</span>
                        </button>
                        <button
                          onClick={() => handleCardReview(5, true)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Easy</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={prevStudyCard}
                disabled={sessionCards.length <= 1}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2">
                {sessionCards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentCardIndex(index);
                      setShowAnswer(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentCardIndex ? "bg-blue-400" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStudyCard}
                disabled={sessionCards.length <= 1}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : /* Regular Vocabulary Display */
      vocabularyData?.cards && vocabularyData.cards.length > 0 ? (
        <div className="space-y-6">
          {/* Card Display */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {currentCard && (
                <motion.div
                  key={currentCardIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="bg-black/20 rounded-lg p-6 border border-white/10 min-h-[300px] flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-white/60">
                      Card {currentCardIndex + 1} of{" "}
                      {vocabularyData.cards.length}
                    </span>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(
                        currentCard.frequency
                      )}`}
                    >
                      {currentCard.frequency}
                    </div>
                  </div>

                  {/* Question Side */}
                  {!showAnswer ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="text-2xl font-bold text-white mb-4 font-serif">
                        {currentCard.word}
                      </div>
                      <p className="text-white/70 mb-6">
                        What does this word mean?
                      </p>
                      <button
                        onClick={() => setShowAnswer(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Show Answer
                      </button>
                    </div>
                  ) : (
                    /* Answer Side */
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-white mb-4 font-serif">
                        {currentCard.word}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-white mb-2">
                            Meaning
                          </h3>
                          <p className="text-white/90">{currentCard.meaning}</p>
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
                              Mnemonic
                            </h3>
                            <p className="text-white/80 text-sm">
                              {currentCard.mnemonicDevice}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => setShowAnswer(false)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Back to Question
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => {
                  setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                  setShowAnswer(false);
                }}
                disabled={currentCardIndex === 0}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2">
                {vocabularyData.cards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentCardIndex(index);
                      setShowAnswer(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentCardIndex ? "bg-blue-400" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  setCurrentCardIndex((prev) =>
                    Math.min(vocabularyData.cards.length - 1, prev + 1)
                  );
                  setShowAnswer(false);
                }}
                disabled={currentCardIndex === vocabularyData.cards.length - 1}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Vocabulary Cards
          </h3>
          <p className="text-white/60 mb-6">
            {currentText
              ? "Generate vocabulary cards from your analyzed text"
              : storedVocabularyCards.length > 0
              ? "Start a study session with your saved cards"
              : "Analyze some Latin text first to generate vocabulary cards"}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
            {currentText && (
              <button
                onClick={handleGenerateVocabulary}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                <span>Generate Vocabulary Cards</span>
              </button>
            )}

            {storedVocabularyCards.length > 0 && (
              <button
                onClick={startStudyMode}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Target className="w-5 h-5" />
                <span>Start Study Session</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabDeck;
