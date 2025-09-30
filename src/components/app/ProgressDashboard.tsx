import { motion } from "framer-motion";
import {
  Activity,
  Award,
  BarChart3,
  Book,
  Calendar,
  Clock,
  Flame,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../../store/appStore";

const ProgressDashboard = () => {
  const {
    storedVocabularyCards,
    storedTexts,
    userProfile,
    getStudyStats,
    getStudySessions,
  } = useAppStore();

  const studyStats = getStudyStats();
  const studySessions = getStudySessions();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );

  // Calculate additional statistics
  const totalStudyTime = userProfile?.stats.totalStudyTime || 0;
  const currentStreak = userProfile?.stats.currentStreak || 0;
  const longestStreak = userProfile?.stats.longestStreak || 0;
  const level = userProfile?.stats.level || 1;
  const xp = userProfile?.stats.xp || 0;

  // Calculate XP progress to next level
  const xpForNextLevel = level * 1000;
  const xpProgress = ((xp % 1000) / 1000) * 100;

  // Get recent activity (last 7 days)
  const recentSessions = studySessions
    .filter((session) => session.date > Date.now() - 7 * 24 * 60 * 60 * 1000)
    .sort((a, b) => b.date - a.date);

  const recentAccuracy =
    recentSessions.length > 0
      ? recentSessions.reduce((sum, session) => sum + session.accuracy, 0) /
        recentSessions.length
      : 0;

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-serif">
            Learning Progress
          </h1>
          <p className="text-white/60 text-lg">
            Track your Latin learning journey and achievements
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Cards</p>
                <p className="text-2xl font-bold text-white">
                  {studyStats.totalCards}
                </p>
              </div>
              <Book className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Study Time</p>
                <p className="text-2xl font-bold text-white">
                  {formatTime(totalStudyTime)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Current Streak</p>
                <p className="text-2xl font-bold text-white">
                  {currentStreak} days
                </p>
              </div>
              <Flame className="w-8 h-8 text-orange-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Accuracy</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(studyStats.accuracyRate * 100)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-400" />
            </div>
          </motion.div>
        </div>

        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                {level}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Level {level}</h3>
                <p className="text-white/60">Latin Scholar</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">XP Progress</p>
              <p className="text-lg font-semibold text-white">
                {xp} / {xpForNextLevel}
              </p>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Study Activity Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Study Activity</h3>
              <div className="flex space-x-2">
                {(["week", "month", "year"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range
                        ? "bg-blue-500 text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {recentSessions.slice(0, 5).map((session, index) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <div>
                      <p className="text-white text-sm font-medium">
                        {formatDate(session.date)}
                      </p>
                      <p className="text-white/60 text-xs">
                        {session.cardsReviewed} cards •{" "}
                        {formatTime(session.duration)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">
                      {Math.round(session.accuracy * 100)}%
                    </p>
                    <p className="text-white/60 text-xs">accuracy</p>
                  </div>
                </div>
              ))}

              {recentSessions.length === 0 && (
                <div className="text-center py-8 text-white/60">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent study sessions</p>
                  <p className="text-sm">
                    Start studying to see your progress!
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Achievements Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Recent Achievements
              </h3>
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>

            <div className="space-y-4">
              {/* Sample achievements - in a real app, these would come from user data */}
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-400/30">
                <div className="w-10 h-10 rounded-full bg-yellow-400/30 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">First Steps</p>
                  <p className="text-white/60 text-sm">
                    Completed your first study session
                  </p>
                </div>
                <div className="text-yellow-400 text-sm font-medium">
                  Unlocked
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30">
                <div className="w-10 h-10 rounded-full bg-blue-400/30 flex items-center justify-center">
                  <Book className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Vocabulary Builder</p>
                  <p className="text-white/60 text-sm">
                    Added 50 vocabulary cards
                  </p>
                </div>
                <div className="text-blue-400 text-sm font-medium">
                  {studyStats.totalCards >= 50
                    ? "Unlocked"
                    : `${studyStats.totalCards}/50`}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-400/30">
                <div className="w-10 h-10 rounded-full bg-green-400/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Speed Learner</p>
                  <p className="text-white/60 text-sm">
                    Maintained 90%+ accuracy for a week
                  </p>
                </div>
                <div className="text-green-400 text-sm font-medium">
                  {recentAccuracy >= 0.9
                    ? "Unlocked"
                    : `${Math.round(recentAccuracy * 100)}%`}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white/60" />
                </div>
                <div className="flex-1">
                  <p className="text-white/60 font-semibold">Latin Master</p>
                  <p className="text-white/40 text-sm">
                    Reach level 10 and master 1000 words
                  </p>
                </div>
                <div className="text-white/40 text-sm font-medium">Locked</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detailed Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              Detailed Statistics
            </h3>
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {studyStats.newCards}
              </div>
              <div className="text-white/60">New Cards</div>
              <div className="text-sm text-white/40">To learn</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {studyStats.learningCards}
              </div>
              <div className="text-white/60">Learning</div>
              <div className="text-sm text-white/40">In progress</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {studyStats.dueCards}
              </div>
              <div className="text-white/60">Due for Review</div>
              <div className="text-sm text-white/40">Ready to study</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {Math.round(studyStats.avgEaseFactor * 100) / 100}
              </div>
              <div className="text-white/60">Avg Ease Factor</div>
              <div className="text-sm text-white/40">Difficulty rating</div>
            </div>
          </div>
        </motion.div>

        {/* Motivational Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-white/10 text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-emerald-400/30 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {currentStreak > 0 ? `Keep it up! 🔥` : "Ready to start?"}
          </h3>
          <p className="text-white/80 mb-4">
            {currentStreak > 0
              ? `You're on a ${currentStreak}-day streak! Consistency is key to mastering Latin.`
              : "Start your learning journey today and build lasting knowledge through spaced repetition."}
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-white/60">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Study daily for best results</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>Aim for 20-30 cards per session</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProgressDashboard;

