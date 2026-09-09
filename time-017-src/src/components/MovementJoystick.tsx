import React, { useState, useRef, useEffect } from "react";

interface MovementJoystickProps {
  onChange: (x: number, z: number) => void;
}

export function MovementJoystick({ onChange }: MovementJoystickProps) {
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const maxRadius = 45; // Max joystick radius in px

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (active) return;

    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    setActive(true);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      // Set start center point in absolute screen space
      startPos.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!active || touchId.current === null) return;

    // Find the correct touch event
    let activeTouch: Touch | null = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === touchId.current) {
        activeTouch = e.touches[i];
        break;
      }
    }

    if (!activeTouch) return;

    // Calculate delta relative to start position
    const dx = activeTouch.clientX - startPos.current.x;
    const dy = activeTouch.clientY - startPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let finalX = dx;
    let finalY = dy;

    // Clamp knob within outer ring radius
    if (distance > maxRadius) {
      finalX = (dx / distance) * maxRadius;
      finalY = (dy / distance) * maxRadius;
    }

    setKnobPos({ x: finalX, y: finalY });

    // Output normalized movement coordinates:
    // X maps to terrain X, Y maps to terrain Z
    const normX = finalX / maxRadius;
    const normZ = finalY / maxRadius;
    onChange(normX, normZ);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!active || touchId.current === null) return;

    // Verify if our active touch ended
    let ended = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        ended = true;
        break;
      }
    }

    if (ended) {
      setActive(false);
      setKnobPos({ x: 0, y: 0 });
      touchId.current = null;
      onChange(0, 0); // stop movement
    }
  };

  useEffect(() => {
    // Bind to window touch listeners for reliable movement tracking outside the div
    if (active) {
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
      window.addEventListener("touchcancel", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [active]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      className="fixed bottom-12 left-12 w-28 h-28 rounded-full border border-gold-warm/20 bg-earth-deep/50 backdrop-blur-md flex items-center justify-center select-none z-50 pointer-events-auto shadow-[0_0_15px_rgba(20,18,14,0.3)] transition-opacity duration-300"
      style={{ touchAction: "none" }}
    >
      {/* Joystick Base Outer Ring */}
      <div className="w-20 h-20 rounded-full border border-gold-warm/10 bg-earth-dark/40 flex items-center justify-center">
        {/* Joystick Handle Knob */}
        <div
          className="w-10 h-10 rounded-full bg-gold-warm/80 shadow-[0_0_10px_rgba(227,196,133,0.3)] pointer-events-none transition-transform duration-75"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>
    </div>
  );
}
