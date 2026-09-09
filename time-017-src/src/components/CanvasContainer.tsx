import React, { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Terrain } from "./Terrain";
import { PlayerOrb } from "./PlayerOrb";
import { RootsSystem } from "./RootsSystem";
import { MemoryOrb, useMemories } from "./MemoryOrb";
import { AncientTree } from "./AncientTree";

interface CanvasContainerProps {
  moveInput: { x: number; z: number; isMoving: boolean };
  stillnessTime: number;
  onPositionUpdate: (pos: THREE.Vector3, isMoving: boolean) => void;
  onNearTreeStill: (isStillNearTree: boolean) => void;
  onCollectMemory: (text: string) => void;
  endingStarted: boolean;
  reducedMotion: boolean;
  playerPos: THREE.Vector3;
}

// Camera tracking controller inside Canvas context
function CameraController({
  playerPos,
  endingStarted,
  reducedMotion,
}: {
  playerPos: THREE.Vector3;
  endingStarted: boolean;
  reducedMotion: boolean;
}) {
  const currentLookAt = useRef(new THREE.Vector3(0, 0.8, 0));

  useFrame((state) => {
    const tCam = new THREE.Vector3();
    const tLook = new THREE.Vector3();

    if (endingStarted) {
      // Cinematic ending pull up: look straight down from high up
      tCam.set(playerPos.x, playerPos.y + 36, playerPos.z + 0.1);
      tLook.copy(playerPos);
    } else {
      // Regular follow: float behind and above player orb
      tCam.set(playerPos.x, playerPos.y + 7.5, playerPos.z + 13.0);
      tLook.set(playerPos.x, playerPos.y + 0.2, playerPos.z);
    }

    // Smooth camera movements
    const lerpSpeed = reducedMotion ? 0.2 : endingStarted ? 0.015 : 0.045;
    state.camera.position.lerp(tCam, lerpSpeed);

    // Smooth lookAt transitions
    currentLookAt.current.lerp(tLook, lerpSpeed);
    state.camera.lookAt(currentLookAt.current);
  });

  return null;
}

export function CanvasContainer({
  moveInput,
  stillnessTime,
  onPositionUpdate,
  onNearTreeStill,
  onCollectMemory,
  endingStarted,
  reducedMotion,
  playerPos,
}: CanvasContainerProps) {
  // Spawn memories lists
  const memories = useMemories();

  return (
    <div className="absolute inset-0 w-full h-full bg-[#060605] z-0">
      <Canvas
        shadows
        camera={{ position: [0, 8, 14], fov: 48 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        {/* Meditative atmospheric fog */}
        <fogExp2 attach="fog" args={["#060605", 0.035]} />

        {/* Global minimal lighting */}
        <ambientLight intensity={0.07} color="#ffffff" />
        <directionalLight
          position={[25, 45, 15]}
          intensity={0.08}
          color="#e4dfd0"
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-camera-far={200}
          shadow-camera-left={-60}
          shadow-camera-right={60}
          shadow-camera-top={60}
          shadow-camera-bottom={-60}
          shadow-bias={-0.002}
        />

        {/* Terrain */}
        <Terrain />

        {/* Roots and Flora drawing system */}
        <RootsSystem
          playerPosition={playerPos}
          isMoving={moveInput.isMoving}
          stillnessTime={stillnessTime}
          endingStarted={endingStarted}
          reducedMotion={reducedMotion}
        />

        {/* Discoverable Memories */}
        {!endingStarted &&
          memories.map((m) => (
            <MemoryOrb
              key={m.id}
              id={m.id}
              position={m.position}
              text={m.text}
              playerPos={playerPos}
              onCollect={onCollectMemory}
              reducedMotion={reducedMotion}
            />
          ))}

        {/* Target ancient tree */}
        <AncientTree
          playerPos={playerPos}
          isMoving={moveInput.isMoving}
          onNearTreeStill={onNearTreeStill}
          endingStarted={endingStarted}
          reducedMotion={reducedMotion}
        />

        {/* Player Orb Avatar */}
        <PlayerOrb
          moveInput={moveInput}
          onPositionUpdate={onPositionUpdate}
          reducedMotion={reducedMotion}
          endingStarted={endingStarted}
        />

        {/* Interactive camera manager */}
        <CameraController
          playerPos={playerPos}
          endingStarted={endingStarted}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}
export default CanvasContainer;
