import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Eye, EyeOff } from "lucide-react";

interface ExperienceOverlayProps {
  onEnter: () => void;
  isEntered: boolean;
  stillnessTime: number;
  currentReflection: string | null;
  onClearReflection: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  reducedMotion: boolean;
  onReducedMotionToggle: () => void;
  endingStarted: boolean;
  endingComplete: boolean;
  isMobile: boolean;
}

export function ExperienceOverlay({
  onEnter,
  isEntered,
  stillnessTime,
  currentReflection,
  onClearReflection,
  volume,
  onVolumeChange,
  isMuted,
  onMuteToggle,
  reducedMotion,
  onReducedMotionToggle,
  endingStarted,
  endingComplete,
  isMobile,
}: ExperienceOverlayProps) {
  const [showIntro, setShowIntro] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null);
  
  // Track milestones shown to avoid duplicates in a single session
  const [shownMilestones, setShownMilestones] = useState<Set<string>>(new Set());

  // 1. INTRO TITLE FADE-OUT SEQUENCING
  useEffect(() => {
    if (isEntered) {
      setShowIntro(true);
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 5500); // 5.5s intro fade time
      return () => clearTimeout(timer);
    }
  }, [isEntered]);

  // 2. MILESTONE LOGIC MONITORING
  useEffect(() => {
    if (!isEntered || endingStarted) return;

    let milestone: string | null = null;
    if (stillnessTime >= 20.0) milestone = "Silence";
    else if (stillnessTime >= 15.0) milestone = "Presence";
    else if (stillnessTime >= 10.0) milestone = "Expanding";
    else if (stillnessTime >= 5.0) milestone = "Wholeness";
    else if (stillnessTime >= 2.0) milestone = "Rooted";

    if (milestone && !shownMilestones.has(milestone)) {
      setActiveMilestone(milestone);
      setShownMilestones((prev) => {
        const next = new Set(prev);
        next.add(milestone!);
        return next;
      });

      // Dissolve milestone badge after 3.2 seconds
      const timer = setTimeout(() => {
        setActiveMilestone(null);
      }, 3200);
      return () => clearTimeout(timer);
    }

    // Reset milestones when player breaks stillness (stillness goes to 0)
    if (stillnessTime === 0) {
      setActiveMilestone(null);
      setShownMilestones(new Set());
    }
  }, [stillnessTime, isEntered, endingStarted]);

  // 3. REFLECTION DISSOLVE TRIGGER
  useEffect(() => {
    if (currentReflection) {
      const timer = setTimeout(() => {
        onClearReflection();
      }, 4800); // display for 4.8s
      return () => clearTimeout(timer);
    }
  }, [currentReflection]);

  // Animation constants based on Reduced Motion mode
  const transitionSettings = {
    duration: reducedMotion ? 0.01 : 1.8,
    ease: "easeInOut" as const,
  };

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-10 font-sans flex flex-col justify-between p-6 md:p-10">
      
      {/* --- ENTRY LEVEL SCREEN SHIELD (Autoplay safeguard) --- */}
      <AnimatePresence>
        {!isEntered && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitionSettings}
            className="absolute inset-0 bg-[#060605] flex flex-col items-center justify-center pointer-events-auto z-50 text-center px-6"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 2.0 }}
              className="max-w-md"
            >
              <h2 className="text-[12px] tracking-[0.4em] text-gold-warm uppercase mb-2">TIME 017</h2>
              <h1 className="text-3xl md:text-4xl tracking-[0.2em] font-light text-foreground mb-12">
                Rooted in the Quiet
              </h1>
              
              <button
                onClick={onEnter}
                className="pointer-events-auto glass-panel px-8 py-3.5 text-xs tracking-[0.3em] uppercase text-gold-warm hover:text-white border border-gold-warm/25 hover:border-gold-warm/60 rounded-sm bg-earth-dark/40 cursor-pointer transition-all duration-700 shadow-md hover:shadow-[0_0_20px_rgba(227,196,133,0.15)] outline-none"
              >
                Enter the Quiet
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- INTRO DISPLAY TITLE SEQUENCE --- */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0, ease: "easeOut" }}
            className="absolute inset-0 bg-[#060605] flex flex-col items-center justify-center z-45 text-center pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1.0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
            >
              <h2 className="text-[10px] tracking-[0.5em] text-gold-warm uppercase mb-3">TIME 017</h2>
              <h1 className="text-2xl md:text-3xl tracking-[0.35em] font-light text-foreground">
                Rooted in the Quiet
              </h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TOP ROW: Dynamic Milestone Badges --- */}
      <div className="w-full flex justify-center items-start pt-6">
        <AnimatePresence mode="wait">
          {activeMilestone && (
            <motion.div
              key={activeMilestone}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 0.6, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 1.2 }}
              className="text-[14px] tracking-[0.5em] uppercase text-gold-glow font-light"
            >
              {activeMilestone}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- CENTER ROW: Discoverable Memory Reflections --- */}
      <div className="w-full flex-grow flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {currentReflection && !endingStarted && (
            <motion.div
              key={currentReflection}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 0.8, scale: 1.0 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 1.5 }}
              className="text-center max-w-xl text-lg md:text-xl font-light tracking-[0.15em] text-foreground text-glow italic leading-relaxed"
            >
              "{currentReflection}"
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- BOTTOM ROW: Minimal Action Prompts and Settings Panel --- */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 mt-auto pointer-events-auto">
        
        {/* Helper info (soft floating tip, desktop only) */}
        <div className="text-[10px] tracking-[0.2em] uppercase text-gold-warm/30 hidden md:block select-none">
          {!isEntered ? "" : stillnessTime > 0 ? "releasing stillness..." : "explore with WASD/Arrows • pause to grow"}
        </div>

        {/* Accessibility & Audio Controls Settings */}
        {isEntered && !endingStarted && (
          <div className="glass-panel px-4 py-2.5 rounded-full flex items-center gap-5 pointer-events-auto shadow-[0_0_10px_rgba(0,0,0,0.4)]">
            
            {/* Reduced Motion Mode Toggle */}
            <button
              onClick={onReducedMotionToggle}
              title={reducedMotion ? "Enable animations" : "Disable motion animations"}
              className="text-gold-warm/40 hover:text-gold-warm hover:scale-105 cursor-pointer transition-all duration-300 outline-none"
            >
              {reducedMotion ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>

            {/* Mute Button */}
            <button
              onClick={onMuteToggle}
              title={isMuted ? "Unmute sound" : "Mute sound"}
              className="text-gold-warm/40 hover:text-gold-warm hover:scale-105 cursor-pointer transition-all duration-300 outline-none"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Sound Volume Slider */}
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume * 100}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value) / 100)}
                className="w-16 md:w-20 accent-gold-warm h-0.5 bg-earth-muted border-none outline-none appearance-none rounded-full cursor-pointer hover:bg-gold-warm/20 transition-all duration-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* --- CINEMATIC ENDING STAGE OVERLAYS --- */}
      <AnimatePresence>
        {endingStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3.5, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#060605]/40 pointer-events-none z-30"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {endingComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 4.0, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#060605] pointer-events-auto flex flex-col items-center justify-center z-50 text-center px-6"
          >
            <div className="max-w-2xl flex flex-col items-center">
              {/* Final text credits */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.9, y: 0 }}
                transition={{ delay: 1.0, duration: 2.5 }}
                className="mb-16"
              >
                <h2 className="text-[12px] tracking-[0.5em] text-gold-warm uppercase mb-3">TIME 017</h2>
                <h1 className="text-3xl md:text-4xl tracking-[0.25em] font-light text-foreground mb-4">
                  Rooted in the Quiet
                </h1>
                <p className="text-[14px] tracking-[0.3em] font-light text-gold-warm/75 mt-6">
                  Growth turns inward.
                </p>
              </motion.div>

              {/* Minimal social release links */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5, duration: 2.0 }}
                className="flex flex-col gap-3.5 w-72"
              >
                <a
                  href="https://spotify.com"
                  target="_blank"
                  rel="noreferrer"
                  className="glass-panel py-3 text-[11px] tracking-[0.3em] text-gold-warm hover:text-white uppercase border border-gold-warm/20 hover:border-gold-warm/60 rounded-sm bg-earth-dark/30 hover:bg-earth-muted/40 transition-all duration-500 shadow-sm"
                >
                  Listen on Spotify
                </a>
                <a
                  href="https://youtu.be/mDbXJAtvkno"
                  target="_blank"
                  rel="noreferrer"
                  className="glass-panel py-3 text-[11px] tracking-[0.3em] text-gold-warm hover:text-white uppercase border border-gold-warm/20 hover:border-gold-warm/60 rounded-sm bg-earth-dark/30 hover:bg-earth-muted/40 transition-all duration-500 shadow-sm"
                >
                  Watch on YouTube
                </a>
                <a
                  href="https://medium.com/@qmbgjhq/roots-of-wholeness-9bedd68b32b8"
                  target="_blank"
                  rel="noreferrer"
                  className="glass-panel py-3 text-[11px] tracking-[0.3em] text-gold-warm hover:text-white uppercase border border-gold-warm/20 hover:border-gold-warm/60 rounded-sm bg-earth-dark/30 hover:bg-earth-muted/40 transition-all duration-500 shadow-sm"
                >
                  Read the Medium story
                </a>
                <a
                  href="https://opensea.io/item/polygon/0x164ba817278d4308be80b6afe4f7ab55f5aea88c/17"
                  target="_blank"
                  rel="noreferrer"
                  className="glass-panel py-3 text-[11px] tracking-[0.3em] text-gold-warm hover:text-white uppercase border border-gold-warm/20 hover:border-gold-warm/60 rounded-sm bg-earth-dark/30 hover:bg-earth-muted/40 transition-all duration-500 shadow-sm"
                >
                  View the TIME artwork
                </a>
                
                {/* Loop trigger back to beginning or continue to next */}
                <a
                  href="/"
                  className="py-3 text-[10px] tracking-[0.3em] text-gold-warm/40 hover:text-gold-glow uppercase mt-6 outline-none transition-all duration-300"
                >
                  Continue to TIME 018
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
export default ExperienceOverlay;
