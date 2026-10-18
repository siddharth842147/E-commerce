"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/lib/siteConfig";

interface IntroTypingProps {
  userName?: string | null;
  onComplete: () => void;
  reducedMotion?: boolean;
}

export function IntroTyping({
  userName,
  onComplete,
  reducedMotion,
}: IntroTypingProps) {
  // Determine time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeOfDay = "Good Evening";
    if (hour >= 4 && hour < 12) {
      timeOfDay = "Good Morning";
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = "Good Afternoon";
    }
    return userName ? `${timeOfDay}, ${userName}` : timeOfDay;
  };

  const line1Full = getGreeting();
  const line2Full = `Welcome to ${siteConfig.intro.brandName}`;
  const line3Full = siteConfig.intro.tagline;

  const [displayedLine1, setDisplayedLine1] = useState("");
  const [displayedLine2, setDisplayedLine2] = useState("");
  const [displayedLine3, setDisplayedLine3] = useState("");
  const [currentLine, setCurrentLine] = useState<1 | 2 | 3 | 4>(1);

  // If reduced motion is requested, render everything immediately and signal completion
  useEffect(() => {
    if (reducedMotion) {
      setDisplayedLine1(line1Full);
      setDisplayedLine2(line2Full);
      setDisplayedLine3(line3Full);
      const timer = setTimeout(() => onComplete(), 1000);
      return () => clearTimeout(timer);
    }
  }, [reducedMotion, line1Full, line2Full, line3Full, onComplete]);

  // Typing logic
  useEffect(() => {
    if (reducedMotion) return;

    const speed = siteConfig.intro.typingSpeedMs || 45;
    let timeoutId: NodeJS.Timeout;

    if (currentLine === 1) {
      if (displayedLine1.length < line1Full.length) {
        timeoutId = setTimeout(() => {
          setDisplayedLine1(line1Full.slice(0, displayedLine1.length + 1));
        }, speed);
      } else {
        timeoutId = setTimeout(() => setCurrentLine(2), 250);
      }
    } else if (currentLine === 2) {
      if (displayedLine2.length < line2Full.length) {
        timeoutId = setTimeout(() => {
          setDisplayedLine2(line2Full.slice(0, displayedLine2.length + 1));
        }, speed);
      } else {
        timeoutId = setTimeout(() => setCurrentLine(3), 250);
      }
    } else if (currentLine === 3) {
      if (displayedLine3.length < line3Full.length) {
        timeoutId = setTimeout(() => {
          setDisplayedLine3(line3Full.slice(0, displayedLine3.length + 1));
        }, speed);
      } else {
        timeoutId = setTimeout(() => {
          setCurrentLine(4);
          // Hold for holdDurationMs then complete
          setTimeout(() => onComplete(), siteConfig.intro.holdDurationMs || 900);
        }, 150);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [
    currentLine,
    displayedLine1,
    displayedLine2,
    displayedLine3,
    line1Full,
    line2Full,
    line3Full,
    onComplete,
    reducedMotion,
  ]);

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 max-w-2xl select-none">
      {/* Line 1: Time of Day Greeting */}
      <div className="h-7 sm:h-8 flex items-center justify-center">
        <span className="font-label-md sm:text-base text-primary-fixed uppercase tracking-widest font-semibold drop-shadow-sm">
          {displayedLine1}
          {currentLine === 1 && (
            <span className="inline-block w-2 h-4 sm:h-5 ml-1 bg-secondary-container animate-pulse" />
          )}
        </span>
      </div>

      {/* Line 2: Welcome to Kartiva */}
      <div className="min-h-[52px] sm:min-h-[64px] flex items-center justify-center my-1">
        <h1 className="font-display-hero-mobile sm:font-display-hero text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          {displayedLine2.includes("Kartiva") ? (
            <>
              {displayedLine2.replace("Kartiva", "")}
              <span className="bg-gradient-to-r from-primary-fixed via-purple-300 to-secondary-container bg-clip-text text-transparent">
                Kartiva
              </span>
            </>
          ) : (
            displayedLine2
          )}
          {currentLine === 2 && (
            <span className="inline-block w-2.5 h-7 sm:h-10 ml-1.5 bg-secondary-container animate-pulse" />
          )}
        </h1>
      </div>

      {/* Line 3: Tagline */}
      <div className="h-8 sm:h-10 flex items-center justify-center">
        <p className="font-body-md sm:font-body-lg text-sm sm:text-lg text-slate-300/90 font-medium">
          {displayedLine3}
          {currentLine === 3 && (
            <span className="inline-block w-2 h-4 sm:h-5 ml-1 bg-secondary-container animate-pulse" />
          )}
        </p>
      </div>

      {/* Screen-reader accessible full announcement */}
      <div className="sr-only" aria-live="polite">
        {line1Full}. {line2Full}. {line3Full}.
      </div>
    </div>
  );
}
