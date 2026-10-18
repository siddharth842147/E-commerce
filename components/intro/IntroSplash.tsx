"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { siteConfig } from "@/lib/siteConfig";
import { createClient } from "@/lib/supabase/client";
import { CSS3DFallback } from "./CSS3DFallback";
import { IntroTyping } from "./IntroTyping";

const DynamicThreeScene = dynamic(
  () => import("./ThreeIntroScene"),
  {
    ssr: false,
    loading: () => <CSS3DFallback />,
  }
);

export function IntroSplash() {
  const searchParams = useSearchParams();
  const forceIntro = searchParams.get("intro") === "1";
  const reducedMotion = useReducedMotion() ?? false;

  const [visible, setVisible] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState<boolean>(false);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  // Detect WebGL capability on client
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  // Check sessionStorage and forceIntro
  useEffect(() => {
    if (!siteConfig.intro.enabled) {
      setHasCheckedSession(true);
      return;
    }

    try {
      const alreadySeen = window.sessionStorage.getItem("kartiva_intro_seen");
      if (forceIntro || (!alreadySeen && siteConfig.intro.showOncePerSession)) {
        setVisible(true);
      }
    } catch {
      // If sessionStorage is disabled/blocked in private mode, still respect forceIntro
      if (forceIntro) {
        setVisible(true);
      }
    } finally {
      setHasCheckedSession(true);
    }
  }, [forceIntro]);

  // Fetch logged in user's first name if available
  useEffect(() => {
    if (!visible) return;

    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const name =
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            user.email?.split("@")[0] ||
            null;
          if (name) {
            // Capitalize first name
            const firstName = name.split(" ")[0];
            setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
          }
        }
      });
    } catch {
      // Guest or error
    }
  }, [visible]);

  // Lock scroll while intro is visible
  useEffect(() => {
    if (visible) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
        document.documentElement.style.overflow = "";
      };
    }
  }, [visible]);

  // Dismiss intro handler
  const dismissIntro = useCallback(() => {
    setVisible(false);
    try {
      window.sessionStorage.setItem("kartiva_intro_seen", "1");
    } catch {
      // Ignore sessionStorage errors
    }
  }, []);

  // Keyboard shortcut (Escape to skip)
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissIntro();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, dismissIntro]);

  // Safety fallback timeout: Don't lock users if anything gets stuck
  useEffect(() => {
    if (!visible) return;
    const safetyTimer = setTimeout(() => {
      dismissIntro();
    }, 7000);
    return () => clearTimeout(safetyTimer);
  }, [visible, dismissIntro]);

  if (!hasCheckedSession || !visible) return null;

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Welcome to Kartiva"
          aria-modal="true"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            filter: "blur(14px)",
            transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={dismissIntro}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-between py-12 px-6 bg-gradient-to-b from-slate-950 via-[#18133f] to-slate-950 text-white overflow-hidden cursor-pointer select-none"
        >
          {/* Ambient Glowing Background Orbs */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-secondary-container/20 blur-[120px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/15 via-transparent to-transparent pointer-events-none" />

          {/* Top Brand Micro Header */}
          <div className="relative z-10 flex items-center gap-2 pt-2">
            <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
            <span className="font-label-sm text-label-sm tracking-widest uppercase font-bold text-slate-400">
              {siteConfig.name} Online
            </span>
          </div>

          {/* Center Content: 3D Animation + Typewriter Text */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto gap-6 sm:gap-8 max-w-3xl">
            {/* 3D WebGL Scene with CSS 3D Fallback */}
            <motion.div
              initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {hasWebGL && !reducedMotion ? (
                <DynamicThreeScene />
              ) : (
                <CSS3DFallback reducedMotion={reducedMotion} />
              )}
            </motion.div>

            {/* Typewriter Text */}
            <IntroTyping
              userName={userName}
              onComplete={dismissIntro}
              reducedMotion={reducedMotion}
            />
          </div>

          {/* Bottom Bar: Skip Button & Instruction */}
          <div className="relative z-10 w-full max-w-4xl flex items-center justify-between text-xs text-slate-400">
            <span className="hidden sm:inline-block font-body-sm opacity-60">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">ESC</kbd> or click anywhere to skip
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissIntro();
              }}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/15 text-white font-label-md text-label-md font-semibold transition-all shadow-lg"
              aria-label="Skip introduction"
            >
              <span>Skip</span>
              <span className="material-symbols-outlined text-[18px]">
                fast_forward
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
