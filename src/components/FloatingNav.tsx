import { useEffect, useState } from "react";

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
    <nav
      className={`fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
        isScrolled
          ? "backdrop-blur-2xl bg-white/5 shadow-2xl shadow-black/10 border-white/30"
          : "backdrop-blur-xl bg-black/10 border-white/20"
      } rounded-full px-3 sm:px-6 py-2 sm:py-3 border w-[calc(100vw-1rem)] sm:w-auto max-w-md sm:max-w-none`}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-6">
        {/* Logo */}
        <a
          href="/"
          className="text-base sm:text-lg font-bold text-white hover:text-primary-300 transition-colors flex-shrink-0"
        >
          Latinium.ai
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          <a
            href="/"
            className="text-white/70 hover:text-white transition-colors text-xs lg:text-sm font-medium px-2 lg:px-3 py-1 rounded-full hover:bg-white/10"
          >
            Home
          </a>
          <a
            href="/app"
            className="text-white/70 hover:text-white transition-colors text-xs lg:text-sm font-medium px-2 lg:px-3 py-1 rounded-full hover:bg-white/10"
          >
            App
          </a>
          <a
            href="/examples"
            className="text-white/70 hover:text-white transition-colors text-xs lg:text-sm font-medium px-2 lg:px-3 py-1 rounded-full hover:bg-white/10"
          >
            Examples
          </a>
          <a
            href="/about"
            className="text-white/70 hover:text-white transition-colors text-xs lg:text-sm font-medium px-2 lg:px-3 py-1 rounded-full hover:bg-white/10"
          >
            About
          </a>
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
          <a
            href="/app"
            className="px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium text-xs sm:text-sm rounded-full hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 transform hover:scale-105 border border-white/20 flex-shrink-0"
          >
            Launch App
          </a>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 py-3 border-t border-white/10">
          <div className="flex flex-col gap-2">
            <a
              href="/"
              className="text-white/70 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="/app"
              className="text-white/70 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              App
            </a>
            <a
              href="/examples"
              className="text-white/70 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Examples
            </a>
            <a
              href="/about"
              className="text-white/70 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
