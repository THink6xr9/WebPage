import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "./Terrain";

interface AncientTreeProps {
  playerPos: THREE.Vector3;
  isMoving: boolean;
  onNearTreeStill: (isStillNearTree: boolean) => void;
  endingStarted: boolean;
  reducedMotion: boolean;
}

export function AncientTree({
  playerPos,
  isMoving,
  onNearTreeStill,
  endingStarted,
  reducedMotion,
}: AncientTreeProps) {
  const treePos = useMemo(() => {
    const x = 0;
    const z = -100;
    const y = getTerrainHeight(x, z);
    return new THREE.Vector3(x, y, z);
  }, []);

  const beaconRef = useRef<THREE.Mesh>(null);
  const beaconLightRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    // 1. BEACON ANIMATION (Breathe/Pulsing)
    if (beaconRef.current && !reducedMotion) {
      const time = state.clock.getElapsedTime();
      const pulseSpeed = endingStarted ? 3.0 : 0.8;
      const baseOpacity = endingStarted ? 0.25 : 0.08;
      const opacityAmp = endingStarted ? 0.15 : 0.03;
      
      const val = Math.sin(time * pulseSpeed) * opacityAmp + baseOpacity;
      const mat = beaconRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = val;
      }
      
      // Rotate the beacon slightly for volumetric shimmer
      beaconRef.current.rotation.y += delta * 0.05;
    }

    if (beaconLightRef.current) {
      const time = state.clock.getElapsedTime();
      const intensity = endingStarted 
        ? 6.0 + Math.sin(time * 3.0) * 2.0 
        : 2.0 + Math.sin(time * 0.8) * 0.5;
      beaconLightRef.current.intensity = intensity;
    }

    // 2. PROXIMITY CHECK
    const dist = playerPos.distanceTo(treePos);
    
    // Player is close if within 8.5 units
    const isClose = dist < 8.5;
    const isSittingStillNearTree = isClose && !isMoving;
    onNearTreeStill(isSittingStillNearTree);
  });

  // Procedural tree branches and cluster geometry definitions
  const foliageScale = 1.0;

  return (
    <group position={treePos}>
      {/* 1. Trunk */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0.5, 1.8, 10, 10]} />
        <meshStandardMaterial
          color="#1e1812" // weathered dark bark
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* 2. Main Branches */}
      <mesh position={[1.5, 7.5, 0.5]} rotation={[0, 0, -0.45]} castShadow>
        <cylinderGeometry args={[0.25, 0.45, 5, 8]} />
        <meshStandardMaterial color="#1e1812" roughness={0.9} />
      </mesh>
      <mesh position={[-1.5, 7.8, -0.5]} rotation={[0, 0, 0.45]} castShadow>
        <cylinderGeometry args={[0.22, 0.4, 4.8, 8]} />
        <meshStandardMaterial color="#1e1812" roughness={0.9} />
      </mesh>

      {/* 3. Painterly Organic Foliage Clusters */}
      {/* Center Foliage */}
      <mesh position={[0, 10.5, 0]} scale={foliageScale} castShadow>
        <dodecahedronGeometry args={[4.2, 1]} />
        <meshStandardMaterial
          color="#12170f" // very dark muted foliage
          roughness={0.95}
          flatShading
        />
      </mesh>
      {/* Left Foliage */}
      <mesh position={[-2.5, 9.2, -0.8]} scale={foliageScale} castShadow>
        <dodecahedronGeometry args={[3.0, 1]} />
        <meshStandardMaterial
          color="#161c12"
          roughness={0.95}
          flatShading
        />
      </mesh>
      {/* Right Foliage */}
      <mesh position={[2.6, 8.8, 1.0]} scale={foliageScale} castShadow>
        <dodecahedronGeometry args={[2.8, 1]} />
        <meshStandardMaterial
          color="#0f140c"
          roughness={0.95}
          flatShading
        />
      </mesh>

      {/* 4. Vertical Golden Light Beacon (Cylinder stretching to sky) */}
      <mesh ref={beaconRef} position={[0, 60, 0]}>
        <cylinderGeometry args={[2.0, 3.5, 120, 16, 1, true]} />
        <meshBasicMaterial
          color="#e3c485"
          transparent
          opacity={0.08}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Warm Point Light illuminating the tree area */}
      <pointLight
        ref={beaconLightRef}
        color="#e3c485"
        intensity={2.0}
        distance={25}
        decay={1.8}
        castShadow
      />
    </group>
  );
}
