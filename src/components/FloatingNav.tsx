import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
        isScrolled
          ? "backdrop-blur-2xl bg-white/10 shadow-2xl shadow-black/10 border-white/30"
          : "backdrop-blur-xl bg-black/10 border-white/20"
      } rounded-full px-3 sm:px-6 py-2 sm:py-3 border w-[calc(100vw-1rem)] sm:w-auto max-w-md sm:max-w-none glass-glow`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-6">
        {/* Logo */}
        <motion.a
          href="/"
          className="text-base sm:text-lg font-bold text-white hover:text-primary-300 transition-colors flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Latinium.ai
          </span>
        </motion.a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          <motion.a
            href="/"
            className="text-white/70 hover:text-white transition-colors text-xs lg:text-sm font-medium px-2 lg:px-3 py-1 rounded-full hover:bg-white/10 relative"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            Home
            <motion.div
              className="absolute inset-0 bg-white/5 rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          </motion.a>
          <motion.a
            href="/app"
            className="text-white/70 hover:text-white transition-colors text-xs lg:text-sm font-medium px-2 lg:px-3 py-1 rounded-full hover:bg-white/10 relative"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            App
            <motion.div
              className="absolute inset-0 bg-white/5 rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          </motion.a>
          <motion.a
            href="/examples"
            className="text-white/70 hover:text-white transition-colors text-xs lg:text-sm font-medium px-2 lg:px-3 py-1 rounded-full hover:bg-white/10 relative"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            Examples
            <motion.div
              className="absolute inset-0 bg-white/5 rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          </motion.a>
          <motion.a
            href="/about"
            className="text-white/70 hover:text-white transition-colors text-xs lg:text-sm font-medium px-2 lg:px-3 py-1 rounded-full hover:bg-white/10 relative"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            About
            <motion.div
              className="absolute inset-0 bg-white/5 rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          </motion.a>
        </div>

        {/* Mobile Menu Button & CTA Button */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* CTA Button */}
          <motion.a
            href="/app"
            className="px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium text-xs sm:text-sm rounded-full hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 border border-white/20 flex-shrink-0 relative overflow-hidden btn-interactive"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Launch App</span>
          </motion.a>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden mt-3 py-3 border-t border-white/10"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col gap-2">
              {["Home", "App", "Examples", "About"].map((item, idx) => (
                <motion.a
                  key={item}
                  href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                  className="text-white/70 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
