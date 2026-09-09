import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "./Terrain";

interface MemoryOrbProps {
  id: string;
  position: [number, number, number];
  text: string;
  playerPos: THREE.Vector3;
  onCollect: (text: string) => void;
  reducedMotion: boolean;
}

export function MemoryOrb({
  id,
  position,
  text,
  playerPos,
  onCollect,
  reducedMotion,
}: MemoryOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [active, setActive] = useState(true);
  const [scale, setScale] = useState(0.25);
  
  // Custom bobbing animation phase offset based on coordinates so they don't bob in sync
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  // Compute terrain height at this spot
  const yBase = useMemo(() => getTerrainHeight(position[0], position[2]) + 0.6, [position]);

  useFrame((state, delta) => {
    if (!active) {
      // Shrink and fade out
      if (scale > 0.01) {
        const nextScale = Math.max(0, scale - delta * 0.8);
        setScale(nextScale);
        if (meshRef.current) {
          meshRef.current.scale.set(nextScale, nextScale, nextScale);
        }
        if (lightRef.current) {
          lightRef.current.intensity = nextScale * 2.0;
        }
      }
      return;
    }

    if (meshRef.current) {
      // 1. BOBBING & SPINNING ANIMATION
      const time = state.clock.getElapsedTime();
      const bob = reducedMotion ? 0 : Math.sin(time * 1.5 + phase) * 0.12;
      meshRef.current.position.set(position[0], yBase + bob, position[2]);
      
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.3;

      // 2. PLAYER PROXIMITY DETECTION
      const distance = meshRef.current.position.distanceTo(playerPos);
      if (distance < 1.8) {
        // Collect!
        setActive(false);
        onCollect(text);
      }
    }
  });

  if (!active && scale <= 0.015) return null;

  return (
    <mesh ref={meshRef} position={[position[0], yBase, position[2]]}>
      <octahedronGeometry args={[0.6, 0]} />
      {/* Meditative glowing crystal mesh */}
      <meshBasicMaterial color="#ffffff" wireframe={false} transparent opacity={0.8} />
      <meshStandardMaterial
        color="#e3c485"
        emissive="#bda26c"
        emissiveIntensity={1.8}
        roughness={0.1}
      />
      {/* Light glow cast on nearby terrain */}
      <pointLight
        ref={lightRef}
        color="#e3c485"
        intensity={1.0}
        distance={7}
        decay={2}
      />
    </mesh>
  );
}

// Utility to generate a randomized list of memories
import { useMemo } from "react";

export interface MemoryData {
  id: string;
  position: [number, number, number];
  text: string;
}

export function useMemories(): MemoryData[] {
  return useMemo(() => {
    const sentences = [
      "Nothing is missing.",
      "I grow down.",
      "Growth turns inward.",
      "The roots know.",
      "The quiet remembers.",
      "Presence is a quiet stream.",
    ];

    const coordinates: [number, number][] = [
      [22, 18],
      [-28, 30],
      [42, -35],
      [-15, -45],
      [55, 20],
      [-52, -18],
    ];

    return sentences.map((text, idx) => {
      const coords = coordinates[idx];
      return {
        id: `memory-${idx}`,
        position: [coords[0], 0, coords[1]], // Y is computed by mesh
        text,
      };
    });
  }, []);
}
