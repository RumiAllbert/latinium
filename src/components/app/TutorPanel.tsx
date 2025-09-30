import { Check, Eye, GraduationCap, Lightbulb, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "../../store/appStore";

const TutorPanel = () => {
  const { tutoringData, tutoringState, generateTutoring, currentText } =
    useAppStore();

  const [stepState, setStepState] = useState<
    Array<{
      user: string;
      showHint: boolean;
      revealed: boolean;
      correct: boolean;
    }>
  >([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (tutoringData?.steps) {
      setStepState(
        tutoringData.steps.map(() => ({
          user: "",
          showHint: false,
          revealed: false,
          correct: false,
        }))
      );
      setCurrentStep(0);
    }
  }, [tutoringData]);

  const handleGenerateTutoring = () => {
    generateTutoring();
  };

  const onCheck = (i: number) => {
    if (!tutoringData?.steps[i]) return;
    const expected = (
      tutoringData.steps[i].expectedAnswer ??
      tutoringData.steps[i].explanation ??
      ""
    )
      .toString()
      .trim()
      .toLowerCase();
    const user = (stepState[i]?.user ?? "").trim().toLowerCase();
    const correct = expected ? expected === user : false;
    setStepState((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, revealed: true, correct } : s))
    );

    // Auto-advance to next step after correct answer
    if (correct && i < (tutoringData?.steps.length || 0) - 1) {
      setTimeout(() => setCurrentStep(i + 1), 1500);
    }
  };

  const onReveal = (i: number) => {
    setStepState((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, revealed: true } : s))
    );
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const completedSteps = stepState.filter(
    (s) => s.revealed && s.correct
  ).length;
  const totalSteps = tutoringData?.steps.length || 0;

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
          <div className="p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            <GraduationCap className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-serif">
              AI Latin Tutor
            </h3>
            <p className="text-sm text-white/60">
              Step-by-step guided learning
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateTutoring}
          disabled={tutoringState === "loading" || !currentText}
          className="px-4 py-2 text-sm rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2 font-medium"
          style={{
            backgroundColor:
              tutoringState === "loading" ? "var(--button)" : "#2563eb",
            color: tutoringState === "loading" ? "var(--fg)" : "white",
          }}
        >
          {tutoringState === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <GraduationCap className="w-4 h-4" />
          )}
          {tutoringState === "loading" ? "Generating..." : "New Session"}
        </button>
      </div>

      {/* Progress Bar */}
      {tutoringData && totalSteps > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70">Progress</span>
            <span className="text-sm font-semibold text-white">
              {completedSteps}/{totalSteps} steps completed
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {tutoringState === "idle" && !tutoringData && (
        <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-xl">
          <GraduationCap className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">
            Ready to Learn Together?
          </h4>
          <p className="text-white/60 mb-6 max-w-sm mx-auto">
            Generate a personalized tutoring session based on your Latin text.
            I'll guide you step-by-step to deeper understanding.
          </p>
          <button
            onClick={handleGenerateTutoring}
            disabled={!currentText}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Learning Session
          </button>
        </div>
      )}

      {/* Loading State */}
      {tutoringState === "loading" && (
        <div className="text-center py-12 border-2 border-dashed border-blue-400/30 rounded-xl bg-blue-500/5">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
            <div className="absolute inset-0 animate-pulse">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full mx-auto"></div>
            </div>
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">
            Preparing Your Session
          </h4>
          <p className="text-blue-200">
            Creating personalized learning steps based on your text...
          </p>
        </div>
      )}

      {/* Error State */}
      {tutoringState === "error" && (
        <div className="text-center py-12 border-2 border-dashed border-red-400/30 rounded-xl bg-red-500/5">
          <div className="w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-400 text-xl">✕</span>
          </div>
          <h4 className="text-lg font-semibold text-red-300 mb-2">
            Oops! Something went wrong
          </h4>
          <p className="text-red-200/80 mb-4">
            Failed to generate your tutoring session. Please try again.
          </p>
          <button
            onClick={handleGenerateTutoring}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Tutoring Content */}
      {tutoringData && tutoringState === "loaded" && (
        <div className="space-y-6">
          {/* Step Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {tutoringData.steps.map((_, index) => {
              const st = stepState[index] ?? {
                user: "",
                showHint: false,
                revealed: false,
                correct: false,
              };
              return (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`
                    min-w-[2.5rem] h-10 rounded-lg border-2 font-bold transition-all flex items-center justify-center
                    ${
                      currentStep === index
                        ? "bg-blue-500 border-blue-400 text-white shadow-lg"
                        : st.correct
                        ? "bg-green-500/20 border-green-400 text-green-300"
                        : st.revealed
                        ? "bg-red-500/20 border-red-400 text-red-300"
                        : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                    }
                  `}
                >
                  {st.correct ? "✓" : index + 1}
                </button>
              );
            })}
          </div>

          {/* Current Step */}
          {tutoringData.steps[currentStep] && (
            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  {currentStep + 1}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {tutoringData.steps[currentStep].title}
                  </h4>
                  <p className="text-sm text-white/60">
                    Step {currentStep + 1} of {totalSteps}
                  </p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4 mb-4">
                <p className="text-white leading-relaxed">
                  {tutoringData.steps[currentStep].question}
                </p>
              </div>

              {(() => {
                const st = stepState[currentStep] ?? {
                  user: "",
                  showHint: false,
                  revealed: false,
                  correct: false,
                };
                return (
                  <div className="space-y-4">
                    {/* Answer Input */}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 rounded-lg border text-white bg-white/5 border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                        placeholder="Type your answer here..."
                        value={st.user}
                        onChange={(e) =>
                          setStepState((prev) =>
                            prev.map((s, i) =>
                              i === currentStep
                                ? { ...s, user: e.target.value }
                                : s
                            )
                          )
                        }
                        disabled={st.revealed}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          !st.revealed &&
                          st.user &&
                          onCheck(currentStep)
                        }
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() =>
                          setStepState((prev) =>
                            prev.map((s, i) =>
                              i === currentStep
                                ? { ...s, showHint: !s.showHint }
                                : s
                            )
                          )
                        }
                        className="px-4 py-2 rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-all flex items-center gap-2"
                        disabled={st.revealed}
                      >
                        <Lightbulb className="w-4 h-4" />
                        {st.showHint ? "Hide Hint" : "Show Hint"}
                      </button>

                      <button
                        onClick={() => onCheck(currentStep)}
                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-all flex items-center gap-2"
                        disabled={st.revealed || !st.user}
                      >
                        <Check className="w-4 h-4" />
                        Check Answer
                      </button>

                      <button
                        onClick={() => onReveal(currentStep)}
                        className="px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all flex items-center gap-2"
                        disabled={st.revealed}
                      >
                        <Eye className="w-4 h-4" />
                        Reveal Answer
                      </button>
                    </div>

                    {/* Hint */}
                    {st.showHint && tutoringData.steps[currentStep].hint && (
                      <div className="bg-amber-500/10 border border-amber-400/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-amber-300" />
                          <span className="font-medium text-amber-300">
                            Hint
                          </span>
                        </div>
                        <p className="text-amber-100">
                          {tutoringData.steps[currentStep].hint}
                        </p>
                      </div>
                    )}

                    {/* Result */}
                    {st.revealed && (
                      <div
                        className={`rounded-lg p-4 border ${
                          st.correct
                            ? "bg-green-500/10 border-green-400/30"
                            : "bg-red-500/10 border-red-400/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-lg ${
                              st.correct ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {st.correct ? "✓" : "✕"}
                          </span>
                          <span
                            className={`font-semibold ${
                              st.correct ? "text-green-300" : "text-red-300"
                            }`}
                          >
                            {st.correct ? "Excellent!" : "Not quite"}
                          </span>
                        </div>
                        {!st.correct &&
                          tutoringData.steps[currentStep].expectedAnswer && (
                            <p className="text-white/80 mb-2">
                              Expected answer:{" "}
                              <span className="font-medium text-white">
                                {tutoringData.steps[currentStep].expectedAnswer}
                              </span>
                            </p>
                          )}
                        {tutoringData.steps[currentStep].explanation && (
                          <p className="text-white/70">
                            {tutoringData.steps[currentStep].explanation}
                          </p>
                        )}
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
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
            >
              Previous Step
            </button>
            <button
              onClick={() =>
                setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))
              }
              disabled={currentStep === totalSteps - 1}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
            >
              Next Step
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorPanel;
