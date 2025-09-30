import { motion } from "framer-motion";
import {
  Book,
  Brain,
  Download,
  Home,
  Library,
  Menu,
  Settings,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "../../store/appStore";
import ThemeToggle from "../ThemeToggle";

interface TopBarProps {
  client?: any; // Astro client directive
}

const TopBar = ({ client }: TopBarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const {
    isStudyMode,
    userProfile,
    getStudyStats,
    exportData,
    importData,
    loadStoredData,
  } = useAppStore();

  const studyStats = getStudyStats();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `latinium-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (importData(content)) {
        alert("Data imported successfully!");
        loadStoredData();
      } else {
        alert("Failed to import data. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${
            isScrolled
              ? "backdrop-blur-lg bg-white/5 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50 shadow-lg"
              : "backdrop-blur-md bg-white/5 dark:bg-slate-900/60 border-b border-white/10 dark:border-slate-700/30"
          }
        `}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 rounded-lg backdrop-blur-sm bg-white/10 border border-white/20 flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-serif">
                Latinium.ai
              </h1>
              <p className="text-xs text-white/60">
                Interactive Latin Learning
              </p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <NavItem icon={Home} label="Home" href="/" />
            <NavItem
              icon={Brain}
              label="Study"
              href="/study"
              active={isStudyMode}
            />
            <NavItem icon={Library} label="Library" href="/library" />
            <NavItem icon={TrendingUp} label="Progress" href="/progress" />
            <NavItem icon={Trophy} label="Achievements" href="/achievements" />
          </nav>

          {/* Right Side Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-3"
          >
            {/* Study Stats (if studying) */}
            {isStudyMode && (
              <div className="hidden lg:flex items-center space-x-4 text-sm text-white/80">
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>{studyStats.dueCards} due</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Book className="w-4 h-4" />
                  <span>{studyStats.totalCards} cards</span>
                </div>
              </div>
            )}

            {/* User Profile */}
            {userProfile ? (
              <div className="w-8 h-8 rounded-full backdrop-blur-sm bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm font-semibold">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <button className="w-8 h-8 rounded-full backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 transition-colors flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Import/Export */}
            <div className="relative group">
              <button className="p-2 rounded-lg backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 transition-colors">
                <Settings className="w-4 h-4 text-white" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 glass-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl">
                <div className="p-2">
                  <button
                    onClick={handleExport}
                    className="w-full text-left px-3 py-2 text-sm text-slate-900 dark:text-white hover:bg-white/10 dark:hover:bg-slate-800/50 rounded-md flex items-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </button>
                  <label className="w-full text-left px-3 py-2 text-sm text-slate-900 dark:text-white hover:bg-white/10 dark:hover:bg-slate-800/50 rounded-md flex items-center space-x-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Import Data</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </motion.div>
        </div>
      </motion.header>

      {/* Mobile Navigation Menu */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isMobileMenuOpen ? 1 : 0,
          height: isMobileMenuOpen ? "auto" : 0,
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-16 left-0 right-0 z-40 md:hidden bg-white/5 dark:bg-slate-900/90 backdrop-blur-lg border-b border-white/20 dark:border-slate-700/50 overflow-hidden"
      >
        <nav className="container mx-auto px-4 py-4 space-y-2">
          <MobileNavItem icon={Home} label="Home" href="/" />
          <MobileNavItem
            icon={Brain}
            label="Study"
            href="/study"
            active={isStudyMode}
          />
          <MobileNavItem icon={Library} label="Library" href="/library" />
          <MobileNavItem icon={TrendingUp} label="Progress" href="/progress" />
          <MobileNavItem
            icon={Trophy}
            label="Achievements"
            href="/achievements"
          />

          <div className="pt-4 border-t border-white/10 dark:border-slate-700/50 space-y-2">
            <button
              onClick={handleExport}
              className="w-full text-left px-3 py-2 text-sm text-slate-900 dark:text-white hover:bg-white/10 dark:hover:bg-slate-800/50 rounded-md flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
            <label className="w-full text-left px-3 py-2 text-sm text-slate-900 dark:text-white hover:bg-white/10 dark:hover:bg-slate-800/50 rounded-md flex items-center space-x-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </nav>
      </motion.div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
}

const NavItem = ({ icon: Icon, label, href, active }: NavItemProps) => (
  <a
    href={href}
    className={`
      flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 nav-link
      ${
        active
          ? "bg-white/10 text-white border border-white/20 backdrop-blur-sm"
          : "hover:bg-white/5"
      }
    `}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm font-medium">{label}</span>
  </a>
);

const MobileNavItem = ({ icon: Icon, label, href, active }: NavItemProps) => (
  <a
    href={href}
    className={`
      flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 nav-link
      ${
        active
          ? "bg-white/10 text-white border border-white/20 backdrop-blur-sm"
          : "hover:bg-white/5"
      }
    `}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </a>
);

export default TopBar;
