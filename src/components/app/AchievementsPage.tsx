import { motion } from "framer-motion";
import {
  Award,
  Book,
  Check,
  Clock,
  Crown,
  Flame,
  Lock,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../../store/appStore";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  category: "vocabulary" | "study" | "consistency" | "mastery";
  requirement: number;
  currentProgress: number;
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Vocabulary Achievements
  {
    id: "first_words",
    name: "First Steps",
    description: "Add your first vocabulary card",
    icon: Book,
    rarity: "common",
    category: "vocabulary",
    requirement: 1,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "vocabulary_builder",
    name: "Vocabulary Builder",
    description: "Add 50 vocabulary cards",
    icon: Book,
    rarity: "uncommon",
    category: "vocabulary",
    requirement: 50,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "word_hoarder",
    name: "Word Hoarder",
    description: "Add 200 vocabulary cards",
    icon: Book,
    rarity: "rare",
    category: "vocabulary",
    requirement: 200,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "latin_master",
    name: "Latin Master",
    description: "Add 1000 vocabulary cards",
    icon: Crown,
    rarity: "legendary",
    category: "vocabulary",
    requirement: 1000,
    currentProgress: 0,
    unlocked: false,
  },

  // Study Achievements
  {
    id: "first_study",
    name: "Getting Started",
    description: "Complete your first study session",
    icon: Target,
    rarity: "common",
    category: "study",
    requirement: 1,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "dedicated_learner",
    name: "Dedicated Learner",
    description: "Complete 10 study sessions",
    icon: Target,
    rarity: "uncommon",
    category: "study",
    requirement: 10,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "study_machine",
    name: "Study Machine",
    description: "Complete 50 study sessions",
    icon: Zap,
    rarity: "rare",
    category: "study",
    requirement: 50,
    currentProgress: 0,
    unlocked: false,
  },

  // Consistency Achievements
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Study for 7 days in a row",
    icon: Flame,
    rarity: "uncommon",
    category: "consistency",
    requirement: 7,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "month_master",
    name: "Month Master",
    description: "Study for 30 days in a row",
    icon: Flame,
    rarity: "rare",
    category: "consistency",
    requirement: 30,
    currentProgress: 0,
    unlocked: false,
  },

  // Mastery Achievements
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Achieve 100% accuracy in a study session",
    icon: Star,
    rarity: "epic",
    category: "mastery",
    requirement: 100,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete a study session in under 5 minutes",
    icon: Clock,
    rarity: "epic",
    category: "mastery",
    requirement: 1,
    currentProgress: 0,
    unlocked: false,
  },
];

const AchievementsPage = () => {
  const { storedVocabularyCards, getStudySessions, getStudyStats } =
    useAppStore();
  const studyStats = getStudyStats();
  const studySessions = getStudySessions();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Calculate achievements progress
  const achievementsWithProgress = ACHIEVEMENTS.map((achievement) => {
    let currentProgress = 0;

    switch (achievement.id) {
      case "first_words":
      case "vocabulary_builder":
      case "word_hoarder":
      case "latin_master":
        currentProgress = storedVocabularyCards.length;
        break;
      case "first_study":
      case "dedicated_learner":
      case "study_machine":
        currentProgress = studySessions.length;
        break;
      case "week_warrior":
      case "month_master":
        // Calculate current streak (simplified for demo)
        currentProgress = Math.min(achievement.requirement, 7); // Placeholder
        break;
      case "perfectionist":
        // Check for perfect sessions
        const perfectSessions = studySessions.filter(
          (session) => session.accuracy >= 1.0
        );
        currentProgress = perfectSessions.length > 0 ? 100 : 0;
        break;
      case "speed_demon":
        // Check for fast sessions
        const fastSessions = studySessions.filter(
          (session) => session.duration < 5
        );
        currentProgress = fastSessions.length > 0 ? 1 : 0;
        break;
    }

    const unlocked = currentProgress >= achievement.requirement;

    return {
      ...achievement,
      currentProgress,
      unlocked,
    };
  });

  const filteredAchievements =
    selectedCategory === "all"
      ? achievementsWithProgress
      : achievementsWithProgress.filter(
          (achievement) => achievement.category === selectedCategory
        );

  const categories = [
    { id: "all", label: "All", count: achievementsWithProgress.length },
    {
      id: "vocabulary",
      label: "Vocabulary",
      count: achievementsWithProgress.filter((a) => a.category === "vocabulary")
        .length,
    },
    {
      id: "study",
      label: "Study",
      count: achievementsWithProgress.filter((a) => a.category === "study")
        .length,
    },
    {
      id: "consistency",
      label: "Consistency",
      count: achievementsWithProgress.filter(
        (a) => a.category === "consistency"
      ).length,
    },
    {
      id: "mastery",
      label: "Mastery",
      count: achievementsWithProgress.filter((a) => a.category === "mastery")
        .length,
    },
  ];

  const unlockedCount = achievementsWithProgress.filter(
    (a) => a.unlocked
  ).length;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500/20 text-gray-300 border-gray-400/30";
      case "uncommon":
        return "bg-green-500/20 text-green-300 border-green-400/30";
      case "rare":
        return "bg-blue-500/20 text-blue-300 border-blue-400/30";
      case "epic":
        return "bg-purple-500/20 text-purple-300 border-purple-400/30";
      case "legendary":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-400/30";
    }
  };

  const getRarityIconColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-400";
      case "uncommon":
        return "text-green-400";
      case "rare":
        return "text-blue-400";
      case "epic":
        return "text-purple-400";
      case "legendary":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
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
            Achievements
          </h1>
          <p className="text-white/60 text-lg">
            Track your Latin learning milestones and unlock rewards
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-white/10 text-center"
          >
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{unlockedCount}</div>
            <div className="text-sm text-white/60">Unlocked</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-white/10 text-center"
          >
            <Star className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {achievementsWithProgress.length}
            </div>
            <div className="text-sm text-white/60">Total</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-white/10 text-center"
          >
            <Book className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {studyStats.totalCards}
            </div>
            <div className="text-sm text-white/60">Cards Studied</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-white/10 text-center"
          >
            <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {studySessions.length}
            </div>
            <div className="text-sm text-white/60">Sessions</div>
          </motion.div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement, index) => {
            const IconComponent = achievement.icon;
            const progress =
              (achievement.currentProgress / achievement.requirement) * 100;
            const isCompleted = achievement.unlocked;

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-xl p-6 border transition-all duration-300 ${
                  isCompleted
                    ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-400/30"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                {/* Achievement Icon */}
                <div
                  className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${
                    isCompleted ? "bg-yellow-400/20" : "bg-white/10"
                  }`}
                >
                  {isCompleted ? (
                    <Check
                      className={`w-6 h-6 ${getRarityIconColor(
                        achievement.rarity
                      )}`}
                    />
                  ) : (
                    <IconComponent
                      className={`w-6 h-6 ${getRarityIconColor(
                        achievement.rarity
                      )}`}
                    />
                  )}
                </div>

                {/* Achievement Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-bold text-lg ${
                        isCompleted ? "text-yellow-300" : "text-white"
                      }`}
                    >
                      {achievement.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(
                        achievement.rarity
                      )}`}
                    >
                      {achievement.rarity}
                    </span>
                  </div>

                  <p
                    className={`text-sm ${
                      isCompleted ? "text-yellow-200" : "text-white/70"
                    }`}
                  >
                    {achievement.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">
                        {achievement.currentProgress} /{" "}
                        {achievement.requirement}
                      </span>
                      <span className="text-white/60">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                            : "bg-gradient-to-r from-blue-400 to-purple-500"
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Lock Overlay for Locked Achievements */}
                {!isCompleted && progress < 100 && (
                  <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
                    <Lock className="w-8 h-8 text-white/40" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Encouragement Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-white/10 text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-purple-400/30 flex items-center justify-center">
              <Award className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {unlockedCount === 0 ? "Your Journey Begins!" : `Amazing Progress!`}
          </h3>
          <p className="text-white/80 mb-4">
            {unlockedCount === 0
              ? "Start studying to unlock your first achievement and begin your Latin mastery journey!"
              : `You've unlocked ${unlockedCount} achievements! Keep up the great work to unlock more.`}
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-white/60">
            <div className="flex items-center space-x-1">
              <Book className="w-4 h-4" />
              <span>Add more vocabulary cards</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>Complete study sessions</span>
            </div>
            <div className="flex items-center space-x-1">
              <Flame className="w-4 h-4" />
              <span>Maintain daily streaks</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AchievementsPage;
