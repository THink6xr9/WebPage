import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "./Terrain";

interface PlayerOrbProps {
  moveInput: { x: number; z: number; isMoving: boolean };
  onPositionUpdate: (pos: THREE.Vector3, isMoving: boolean) => void;
  reducedMotion: boolean;
  endingStarted: boolean;
}

export function PlayerOrb({
  moveInput,
  onPositionUpdate,
  reducedMotion,
  endingStarted,
}: PlayerOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  // Position, velocity, and deceleration refs
  const position = useRef(new THREE.Vector3(0, 0.8, 0));
  const velocity = useRef(new THREE.Vector2(0, 0));

  const maxSpeed = 3.5; // Meditative, slow drift
  const accel = 6.0;
  const friction = 0.08; // High damping for smooth float

  // Notify initial position
  useEffect(() => {
    onPositionUpdate(position.current.clone(), false);
  }, []);

  useFrame((state, delta) => {
    // Limit delta to prevent huge jumps on lag spikes
    const dt = Math.min(delta, 0.1);

    if (meshRef.current) {
      if (!endingStarted) {
        // --- 1. MOVEMENT PHYSICS ---
        const inputX = moveInput.x;
        const inputZ = moveInput.z;

        if (moveInput.isMoving) {
          // Accelerate in input direction
          velocity.current.x += inputX * accel * dt;
          velocity.current.y += inputZ * accel * dt;

          // Clamp to max speed
          const speed = velocity.current.length();
          if (speed > maxSpeed) {
            velocity.current.normalize().multiplyScalar(maxSpeed);
          }
        } else {
          // Decelerate/Friction
          velocity.current.lerp(new THREE.Vector2(0, 0), friction);
        }

        // Apply velocity to position
        position.current.x += velocity.current.x * dt;
        position.current.z += velocity.current.y * dt;

        // Contain player within map boundaries
        const bound = 140;
        position.current.x = THREE.MathUtils.clamp(position.current.x, -bound, bound);
        position.current.z = THREE.MathUtils.clamp(position.current.z, -bound, bound);
      } else {
        // Ending active: slowly drift towards center [0, getHeight(0,-100), -100] (next to tree)
        const target = new THREE.Vector3(0, getTerrainHeight(0, -96) + 0.8, -96);
        position.current.lerp(target, 0.03);
        velocity.current.set(0, 0);
      }

      // Height matches terrain plus hover amplitude
      const terrainY = getTerrainHeight(position.current.x, position.current.z);
      const hoverHeight = 0.8 + (reducedMotion ? 0 : Math.sin(state.clock.getElapsedTime() * 2.0) * 0.08);
      position.current.y = terrainY + hoverHeight;

      // Update mesh position
      meshRef.current.position.copy(position.current);

      // --- 2. PULSING GLOW ANIMATION (AWARENESS) ---
      const pulseSpeed = endingStarted ? 2.5 : 1.0;
      const baseScale = endingStarted ? 0.35 : 0.45;
      const scaleAmp = endingStarted ? 0.15 : 0.06;
      
      const pulseFactor = reducedMotion 
        ? 1.0 
        : Math.sin(state.clock.getElapsedTime() * Math.PI * pulseSpeed);
      
      const currentScale = baseScale + pulseFactor * scaleAmp;
      meshRef.current.scale.set(currentScale, currentScale, currentScale);

      // Sync point light intensity and range to pulse
      if (lightRef.current) {
        const lightIntensity = endingStarted 
          ? 3.5 + pulseFactor * 1.5 
          : 2.0 + pulseFactor * 0.6;
        
        lightRef.current.intensity = lightIntensity;
        lightRef.current.distance = endingStarted ? 25 : 15;
      }

      // Report coordinates and moving state (consider moving if velocity is above threshold)
      const isActuallyMoving = velocity.current.lengthSq() > 0.005;
      onPositionUpdate(position.current.clone(), isActuallyMoving);
    }
  });

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[1, 32, 32]} />
      {/* Pure glowing material (emissive) */}
      <meshStandardMaterial
        color="#ffffff"
        emissive="#e5c158"
        emissiveIntensity={2.5}
        roughness={0}
        metalness={0}
      />
      {/* Dynamic light cast on ground */}
      <pointLight
        ref={lightRef}
        color="#e5c158"
        intensity={2}
        distance={15}
        decay={2}
        castShadow
        shadow-bias={-0.002}
      />
    </mesh>
  );
}
