"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { useInput } from "../hooks/useInput";
import { audioEngine } from "../lib/AudioEngine";
import { CanvasContainer } from "./CanvasContainer";
import { ExperienceOverlay } from "./ExperienceOverlay";
import { MovementJoystick } from "./MovementJoystick";

export function InteractiveExperience() {
  // 1. INPUT BINDINGS
  const { input, setJoystick } = useInput();

  // 2. STATE MANAGER
  const [isEntered, setIsEntered] = useState(false);
  const [playerPos, setPlayerPos] = useState<THREE.Vector3>(new THREE.Vector3(0, 0.8, 0));
  const [isMoving, setIsMoving] = useState(false);
  
  // Stillness trackers
  const [stillnessTime, setStillnessTime] = useState(0);
  const [isNearTreeStill, setIsNearTreeStill] = useState(false);
  const [treeStillnessTime, setTreeStillnessTime] = useState(0);

  // Discoveries
  const [currentReflection, setCurrentReflection] = useState<string | null>(null);

  // Audio settings
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Accessibility
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Ending flow flags
  const [endingStarted, setEndingStarted] = useState(false);
  const [endingComplete, setEndingComplete] = useState(false);

  // Screen resize listener for mobile checks
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3. ENTER EXPERIENCE TRAP
  const handleEnter = () => {
    setIsEntered(true);
    // Initialize Web Audio Engine
    audioEngine.init();
    audioEngine.setVolume(volume);
    audioEngine.setMute(isMuted);
    audioEngine.setMovementState(true); // default moving so only drone plays
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  // 4. MOVEMENT & AUDIO BINDING
  // Sync movement state with Audio Engine
  useEffect(() => {
    if (!isEntered || endingStarted) return;
    audioEngine.setMovementState(isMoving);
  }, [isMoving, isEntered, endingStarted]);

  // 5. STILLNESS TRACKER CLOCK
  useEffect(() => {
    if (!isEntered || endingStarted) return;

    const interval = setInterval(() => {
      if (!isMoving) {
        setStillnessTime((prev) => {
          const next = prev + 0.1;
          audioEngine.updateStillnessTime(next);
          return next;
        });
      } else {
        setStillnessTime(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isMoving, isEntered, endingStarted]);

  // 6. ANCIENT TREE ENDING TIMELINE
  useEffect(() => {
    if (!isEntered || endingStarted) return;

    let interval: any = null;

    if (isNearTreeStill) {
      interval = setInterval(() => {
        setTreeStillnessTime((prev) => {
          const next = prev + 0.1;
          
          // Trigger ending sequence after 30 seconds of stillness beside tree
          if (next >= 30.0) {
            clearInterval(interval);
            triggerEndingSequence();
            return 30.0;
          }
          return next;
        });
      }, 100);
    } else {
      setTreeStillnessTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isNearTreeStill, isEntered, endingStarted]);

  const triggerEndingSequence = () => {
    setEndingStarted(true);
    audioEngine.playEnding();

    // After 8 seconds of vertical camera drift, fade to black and show post-experience links
    setTimeout(() => {
      setEndingComplete(true);
    }, 8500);
  };

  // 7. MEMORY REFLECTIONS LOADER
  const handleCollectMemory = (text: string) => {
    setCurrentReflection(text);
  };

  const handleClearReflection = () => {
    setCurrentReflection(null);
  };

  // 8. MASTER AUDIO INTERFACES
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
  };

  const handleMuteToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMute(nextMute);
  };

  // 9. UPDATE ORB COORDINATES FROM THREE LOOP
  const handlePositionUpdate = (pos: THREE.Vector3, moving: boolean) => {
    setPlayerPos(pos);
    setIsMoving(moving);
  };

  const handleNearTreeStill = (stillNearTree: boolean) => {
    setIsNearTreeStill(stillNearTree);
  };

  // Accessibility toggle
  const handleReducedMotionToggle = () => {
    setReducedMotion(!reducedMotion);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#060605] z-0 pointer-events-auto">
      
      {/* 3D WebGL Canvas */}
      {isEntered && (
        <CanvasContainer
          moveInput={input}
          stillnessTime={stillnessTime}
          onPositionUpdate={handlePositionUpdate}
          onNearTreeStill={handleNearTreeStill}
          onCollectMemory={handleCollectMemory}
          endingStarted={endingStarted}
          reducedMotion={reducedMotion}
          playerPos={playerPos}
        />
      )}

      {/* Touch virtual joystick on Mobile */}
      {isEntered && isMobile && !endingStarted && (
        <MovementJoystick onChange={setJoystick} />
      )}

      {/* UI Overlay HUD layers */}
      <ExperienceOverlay
        onEnter={handleEnter}
        isEntered={isEntered}
        stillnessTime={stillnessTime}
        currentReflection={currentReflection}
        onClearReflection={handleClearReflection}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onMuteToggle={handleMuteToggle}
        reducedMotion={reducedMotion}
        onReducedMotionToggle={handleReducedMotionToggle}
        endingStarted={endingStarted}
        endingComplete={endingComplete}
        isMobile={isMobile}
      />
    </div>
  );
}
export default InteractiveExperience;
