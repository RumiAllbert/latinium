import { BookOpen, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../store/appStore";

const QuizPanel = () => {
  const { quizData, quizState, generateQuiz, currentText } = useAppStore();
  const [stateByQ, setStateByQ] = useState<
    Array<{ selected: number | null; revealed: boolean; showExp: boolean }>
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    if (quizData?.questions) {
      setStateByQ(
        quizData.questions.map(() => ({
          selected: null,
          revealed: false,
          showExp: false,
        }))
      );
      setCurrentQuestion(0);
    }
  }, [quizData]);

  const score = useMemo(() => {
    if (!quizData?.questions || stateByQ.length === 0) return 0;
    return quizData.questions.reduce((acc, q, i) => {
      const st = stateByQ[i];
      return acc + (st?.revealed && st.selected === q.correctAnswer ? 1 : 0);
    }, 0);
  }, [quizData, stateByQ]);

  const total = quizData?.questions?.length ?? 0;
  const answeredQuestions = stateByQ.filter((s) => s.revealed).length;

  const handleGenerateQuiz = () => {
    generateQuiz();
  };

  const handleSelect = (qi: number, oi: number) => {
    setStateByQ((prev) =>
      prev.map((s, i) => (i === qi ? { ...s, selected: oi } : s))
    );
  };

  const handleReveal = (qi: number) => {
    setStateByQ((prev) =>
      prev.map((s, i) => (i === qi ? { ...s, revealed: true } : s))
    );

    // Auto-advance to next question after answering
    if (qi < total - 1) {
      setTimeout(() => setCurrentQuestion(qi + 1), 1000);
    }
  };

  const toggleExplanation = (qi: number) => {
    setStateByQ((prev) =>
      prev.map((s, i) => (i === qi ? { ...s, showExp: !s.showExp } : s))
    );
  };

  const goToQuestion = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
  };

  return (
    <div
      className="p-6 rounded-xl border backdrop-blur-sm"
      style={{
        backgroundColor: "var(--panel)",
        borderColor: "var(--border)",
      }}
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20">
            <BookOpen className="w-6 h-6 text-green-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-serif">
              Knowledge Quiz
            </h3>
            <p className="text-sm text-white/60">Test your understanding</p>
          </div>
        </div>

        <button
          onClick={handleGenerateQuiz}
          disabled={quizState === "loading" || !currentText}
          className="px-4 py-2 text-sm rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2 font-medium"
          style={{
            backgroundColor:
              quizState === "loading" ? "var(--button)" : "#16a34a",
            color: quizState === "loading" ? "var(--fg)" : "white",
          }}
        >
          {quizState === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BookOpen className="w-4 h-4" />
          )}
          {quizState === "loading" ? "Creating..." : "New Quiz"}
        </button>
      </div>

      {/* Progress Bar */}
      {quizData && total > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70">Progress</span>
            <span className="text-sm font-semibold text-white">
              Score: {score}/{total} (
              {total > 0 ? Math.round((score / total) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${total > 0 ? (answeredQuestions / total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {quizState === "idle" && !quizData && (
        <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-xl">
          <BookOpen className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">
            Ready to Test Your Knowledge?
          </h4>
          <p className="text-white/60 mb-6 max-w-sm mx-auto">
            Generate a personalized quiz based on your Latin text analysis.
            Challenge yourself with questions tailored to your reading.
          </p>
          <button
            onClick={handleGenerateQuiz}
            disabled={!currentText}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Quiz
          </button>
        </div>
      )}

      {/* Loading State */}
      {quizState === "loading" && (
        <div className="text-center py-12 border-2 border-dashed border-green-400/30 rounded-xl bg-green-500/5">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
            <div className="absolute inset-0 animate-pulse">
              <div className="w-12 h-12 bg-green-500/20 rounded-full mx-auto"></div>
            </div>
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">
            Creating Your Quiz
          </h4>
          <p className="text-green-200">
            Generating challenging questions based on your text...
          </p>
        </div>
      )}

      {/* Error State */}
      {quizState === "error" && (
        <div className="text-center py-12 border-2 border-dashed border-red-400/30 rounded-xl bg-red-500/5">
          <div className="w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-400 text-xl">✕</span>
          </div>
          <h4 className="text-lg font-semibold text-red-300 mb-2">
            Quiz Generation Failed
          </h4>
          <p className="text-red-200/80 mb-4">
            Unable to create quiz questions. Please try again.
          </p>
          <button
            onClick={handleGenerateQuiz}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Quiz Content */}
      {quizData && quizState === "loaded" && (
        <div className="space-y-6">
          {/* Question Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {quizData.questions.map((_, index) => {
              const st = stateByQ[index] ?? {
                selected: null,
                revealed: false,
                showExp: false,
              };
              const isCorrect =
                st.revealed &&
                st.selected === quizData.questions[index].correctAnswer;
              return (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`
                    min-w-[2.5rem] h-10 rounded-lg border-2 font-bold transition-all flex items-center justify-center
                    ${
                      currentQuestion === index
                        ? "bg-green-500 border-green-400 text-white shadow-lg"
                        : isCorrect
                        ? "bg-green-500/20 border-green-400 text-green-300"
                        : st.revealed
                        ? "bg-red-500/20 border-red-400 text-red-300"
                        : st.selected !== null
                        ? "bg-blue-500/20 border-blue-400 text-blue-300"
                        : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                    }
                  `}
                >
                  {isCorrect
                    ? "✓"
                    : st.revealed && !isCorrect
                    ? "✕"
                    : index + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question */}
          {quizData.questions[currentQuestion] && (
            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  {currentQuestion + 1}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    Question {currentQuestion + 1}
                  </h4>
                  <p className="text-sm text-white/60">
                    {currentQuestion + 1} of {total}
                  </p>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4 mb-6">
                <p className="text-white leading-relaxed text-lg">
                  {quizData.questions[currentQuestion].question}
                </p>
              </div>

              {(() => {
                const st = stateByQ[currentQuestion] ?? {
                  selected: null,
                  revealed: false,
                  showExp: false,
                };
                const question = quizData.questions[currentQuestion];

                return (
                  <div className="space-y-4">
                    {/* Answer Options */}
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = st.selected === optionIndex;
                        const isCorrect =
                          optionIndex === question.correctAnswer;
                        const showResult = st.revealed;

                        let buttonClass =
                          "w-full text-left p-4 rounded-lg border-2 transition-all font-medium ";
                        let textColor = "text-white";

                        if (showResult) {
                          if (isCorrect) {
                            buttonClass += "bg-green-500/20 border-green-400 ";
                            textColor = "text-green-200";
                          } else if (isSelected && !isCorrect) {
                            buttonClass += "bg-red-500/20 border-red-400 ";
                            textColor = "text-red-200";
                          } else {
                            buttonClass += "bg-white/5 border-white/20 ";
                            textColor = "text-white/60";
                          }
                        } else {
                          if (isSelected) {
                            buttonClass += "bg-blue-500/20 border-blue-400 ";
                            textColor = "text-blue-200";
                          } else {
                            buttonClass +=
                              "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 ";
                          }
                        }

                        return (
                          <button
                            key={optionIndex}
                            disabled={showResult}
                            onClick={() =>
                              handleSelect(currentQuestion, optionIndex)
                            }
                            className={buttonClass}
                          >
                            <div
                              className={`flex items-center justify-between ${textColor}`}
                            >
                              <span>
                                <span className="font-bold mr-3">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                {option}
                              </span>
                              {showResult && isCorrect && (
                                <span className="text-green-400 text-xl font-bold">
                                  ✓
                                </span>
                              )}
                              {showResult && isSelected && !isCorrect && (
                                <span className="text-red-400 text-xl font-bold">
                                  ✕
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => handleReveal(currentQuestion)}
                        disabled={st.revealed || st.selected === null}
                        className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {st.revealed ? "Answered" : "Submit Answer"}
                      </button>

                      {question.explanation && (
                        <button
                          onClick={() => toggleExplanation(currentQuestion)}
                          className="px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all"
                        >
                          {st.showExp ? "Hide Explanation" : "Show Explanation"}
                        </button>
                      )}
                    </div>

                    {/* Result Feedback */}
                    {st.revealed && (
                      <div
                        className={`rounded-lg p-4 border ${
                          st.selected === question.correctAnswer
                            ? "bg-green-500/10 border-green-400/30"
                            : "bg-red-500/10 border-red-400/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-xl ${
                              st.selected === question.correctAnswer
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {st.selected === question.correctAnswer ? "✓" : "✕"}
                          </span>
                          <span
                            className={`font-semibold ${
                              st.selected === question.correctAnswer
                                ? "text-green-300"
                                : "text-red-300"
                            }`}
                          >
                            {st.selected === question.correctAnswer
                              ? "Correct!"
                              : "Incorrect"}
                          </span>
                        </div>
                        {st.selected !== question.correctAnswer && (
                          <p className="text-white/80">
                            The correct answer was:{" "}
                            <span className="font-semibold text-green-300">
                              {String.fromCharCode(65 + question.correctAnswer)}
                              . {question.options[question.correctAnswer]}
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {st.showExp && question.explanation && (
                      <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
                        <h5 className="font-semibold text-blue-200 mb-2">
                          Explanation
                        </h5>
                        <p className="text-blue-100 leading-relaxed">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() =>
                setCurrentQuestion(Math.max(0, currentQuestion - 1))
              }
              disabled={currentQuestion === 0}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
            >
              Previous Question
            </button>
            <button
              onClick={() =>
                setCurrentQuestion(Math.min(total - 1, currentQuestion + 1))
              }
              disabled={currentQuestion === total - 1}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
            >
              Next Question
            </button>
          </div>

          {/* Final Results */}
          {answeredQuestions === total && total > 0 && (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20 rounded-xl p-6 text-center">
              <h4 className="text-xl font-bold text-white mb-2">
                Quiz Complete! 🎉
              </h4>
              <p className="text-lg text-white/80 mb-4">
                Final Score:{" "}
                <span className="font-bold text-green-300">
                  {score}/{total}
                </span>
                <span className="text-white/60 ml-2">
                  ({Math.round((score / total) * 100)}%)
                </span>
              </p>
              <button
                onClick={handleGenerateQuiz}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
              >
                Take Another Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizPanel;
