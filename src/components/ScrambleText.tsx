import React, { useEffect, useRef, useState } from "react";

interface ScrambleTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  className = "",
  speed = 50,
  delay = 0,
}) => {
  const [displayText, setDisplayText] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrambleChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setDisplayText("");
    setIsAnimating(false);

    timeoutRef.current = setTimeout(() => {
      setIsAnimating(true);
      let currentIndex = 0;

      intervalRef.current = setInterval(() => {
        if (currentIndex < text.length) {
          // Show scrambled text for characters not yet revealed
          const scrambled = text
            .split("")
            .map((char, index) => {
              if (index < currentIndex) {
                return char; // Already revealed
              } else if (index === currentIndex) {
                return scrambleChars[
                  Math.floor(Math.random() * scrambleChars.length)
                ]; // Current character being scrambled
              } else {
                return scrambleChars[
                  Math.floor(Math.random() * scrambleChars.length)
                ]; // Future characters scrambled
              }
            })
            .join("");

          setDisplayText(scrambled);
          currentIndex++;
        } else {
          // Animation complete
          setDisplayText(text);
          setIsAnimating(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, speed);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, delay]);

  return <span className={className}>{displayText}</span>;
};

export default ScrambleText;
