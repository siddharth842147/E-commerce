"use client";

import { motion } from "framer-motion";

interface CSS3DFallbackProps {
  reducedMotion?: boolean;
}

export function CSS3DFallback({ reducedMotion }: CSS3DFallbackProps) {
  const orbitItems = [
    { icon: "menu_book", color: "from-emerald-400 to-teal-600", angle: 0, label: "Books" },
    { icon: "checkroom", color: "from-orange-400 to-rose-600", angle: 72, label: "Fashion" },
    { icon: "headphones", color: "from-indigo-400 to-purple-600", angle: 144, label: "Audio" },
    { icon: "local_florist", color: "from-amber-400 to-amber-600", angle: 216, label: "Home" },
    { icon: "fitness_center", color: "from-cyan-400 to-blue-600", angle: 288, label: "Fitness" },
  ];

  return (
    <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center [perspective:1000px] select-none">
      {/* Background Soft Aura Orbs */}
      <div className="absolute w-56 h-56 rounded-full bg-primary/30 blur-3xl animate-pulse" />
      <div className="absolute w-44 h-44 rounded-full bg-secondary-container/25 blur-2xl -bottom-4 -right-4" />

      {/* Orbit Track Rings */}
      <div className="absolute inset-4 rounded-full border border-white/10 [transform:rotateX(68deg)] pointer-events-none" />
      <div className="absolute inset-10 rounded-full border border-dashed border-white/15 [transform:rotateX(68deg)] pointer-events-none" />

      {/* Center 3D Floating Logo Shield */}
      <motion.div
        animate={
          reducedMotion
            ? {}
            : {
                rotateY: [0, 360],
                y: [0, -10, 0],
              }
        }
        transition={
          reducedMotion
            ? {}
            : {
                rotateY: { repeat: Infinity, duration: 14, ease: "linear" },
                y: { repeat: Infinity, duration: 3.5, ease: "easeInOut" },
              }
        }
        className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-primary via-indigo-600 to-secondary-container p-1 shadow-2xl shadow-primary/50 [transform-style:preserve-3d]"
      >
        <div className="w-full h-full rounded-[22px] bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center border border-white/20">
          <span className="font-extrabold text-4xl sm:text-5xl tracking-tighter bg-gradient-to-r from-white via-indigo-200 to-amber-200 bg-clip-text text-transparent drop-shadow-md">
            K
          </span>
          <div className="flex gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
          </div>
        </div>
      </motion.div>

      {/* Orbiting 3D Products */}
      {!reducedMotion && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {orbitItems.map((item) => {
            const rad = (item.angle * Math.PI) / 180;
            // Radius of orbit
            const radius = 110;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius * 0.45; // Compressed Y for 3D tilt perspective

            return (
              <motion.div
                key={item.label}
                style={{
                  transform: `translate3d(${x}px, ${y}px, 0)`,
                }}
                className="absolute"
              >
                {/* Counter-rotate to keep icon upright */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${item.color} p-0.5 shadow-lg shadow-black/50`}
                >
                  <div className="w-full h-full rounded-[14px] bg-slate-950/90 backdrop-blur-md flex items-center justify-center text-white/90 border border-white/20">
                    <span className="material-symbols-outlined text-[18px]">
                      {item.icon}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
