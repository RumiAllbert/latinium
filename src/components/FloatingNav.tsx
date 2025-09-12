import { useEffect, useState } from "react";

export default function FloatingNav() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
        isScrolled
          ? "backdrop-blur-2xl bg-white/5 shadow-2xl shadow-black/10 border-white/30"
          : "backdrop-blur-xl bg-black/10 border-white/20"
      } rounded-full px-6 py-3 border`}
    >
      <div className="flex items-center gap-6">
        {/* Logo */}
        <a
          href="/"
          className="text-lg font-bold text-white hover:text-primary-300 transition-colors"
        >
          Latinium.ai
        </a>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="/"
            className="text-white/70 hover:text-white transition-colors text-sm font-medium px-3 py-1 rounded-full hover:bg-white/10"
          >
            Home
          </a>
          <a
            href="/app"
            className="text-white/70 hover:text-white transition-colors text-sm font-medium px-3 py-1 rounded-full hover:bg-white/10"
          >
            App
          </a>
          <a
            href="/examples"
            className="text-white/70 hover:text-white transition-colors text-sm font-medium px-3 py-1 rounded-full hover:bg-white/10"
          >
            Examples
          </a>
          <a
            href="/about"
            className="text-white/70 hover:text-white transition-colors text-sm font-medium px-3 py-1 rounded-full hover:bg-white/10"
          >
            About
          </a>
        </div>

        {/* CTA Button */}
        <a
          href="/app"
          className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium text-sm rounded-full hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 transform hover:scale-105 border border-white/20"
        >
          Launch App
        </a>
      </div>
    </nav>
  );
}
