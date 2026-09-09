import { useEffect, useState, useRef } from "react";

export interface InputState {
  x: number; // Left/Right: -1 to 1
  z: number; // Forward/Backward: -1 to 1
  isMoving: boolean;
}

export function useInput() {
  const [input, setInput] = useState<InputState>({ x: 0, z: 0, isMoving: false });
  const keys = useRef<{ [key: string]: boolean }>({});
  const joystickInput = useRef<{ x: number; z: number }>({ x: 0, z: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(
          key
        )
      ) {
        keys.current[key] = true;
        updateInput();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(
          key
        )
      ) {
        keys.current[key] = false;
        updateInput();
      }
    };

    const updateInput = () => {
      let x = 0;
      let z = 0;

      // Keyboard checking
      if (keys.current["w"] || keys.current["arrowup"]) z -= 1;
      if (keys.current["s"] || keys.current["arrowdown"]) z += 1;
      if (keys.current["a"] || keys.current["arrowleft"]) x -= 1;
      if (keys.current["d"] || keys.current["arrowright"]) x += 1;

      // Normalize diagonal keyboard velocity
      if (x !== 0 && z !== 0) {
        const length = Math.sqrt(x * x + z * z);
        x /= length;
        z /= length;
      }

      // If joystick is active, overlay it
      if (joystickInput.current.x !== 0 || joystickInput.current.z !== 0) {
        x = joystickInput.current.x;
        z = joystickInput.current.z;
      }

      const isMoving = x !== 0 || z !== 0;

      setInput({ x, z, isMoving });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const setJoystick = (x: number, z: number) => {
    joystickInput.current = { x, z };
    
    // Read keyboard state
    let rx = 0;
    let rz = 0;
    if (keys.current["w"] || keys.current["arrowup"]) rz -= 1;
    if (keys.current["s"] || keys.current["arrowdown"]) rz += 1;
    if (keys.current["a"] || keys.current["arrowleft"]) rx -= 1;
    if (keys.current["d"] || keys.current["arrowright"]) rx += 1;

    if (rx !== 0 && rz !== 0) {
      const length = Math.sqrt(rx * rx + rz * rz);
      rx /= length;
      rz /= length;
    }

    // Override with joystick if it is active
    if (x !== 0 || z !== 0) {
      rx = x;
      rz = z;
    }

    setInput({ x: rx, z: rz, isMoving: rx !== 0 || rz !== 0 });
  };

  return { input, setJoystick };
}
