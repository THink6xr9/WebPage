import React, { useState, useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "./Terrain";

interface RootsSystemProps {
  playerPosition: THREE.Vector3;
  isMoving: boolean;
  stillnessTime: number;
  endingStarted: boolean;
  reducedMotion: boolean;
}

interface ForestItem {
  id: string;
  type: "grass" | "flower" | "tree";
  position: [number, number, number];
  rotationY: number;
  color: string;
  maxScale: number;
  currentScale: number;
}

interface RootSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  growthTime: number; // time when it should start growing (0 to 1)
}

interface GrowthZone {
  id: string;
  center: THREE.Vector3;
  roots: RootSegment[];
  flora: ForestItem[];
  maxRadius: number;
  createdTime: number;
}

export function RootsSystem({
  playerPosition,
  isMoving,
  stillnessTime,
  endingStarted,
  reducedMotion,
}: RootsSystemProps) {
  // Trail of steps left when moving
  const [stepRoots, setStepRoots] = useState<{ id: string; pos: [number, number, number]; scale: number }[]>([]);
  const lastStepPos = useRef<THREE.Vector3>(new THREE.Vector3());

  // Collection of growth zones created by stillness
  const [zones, setZones] = useState<GrowthZone[]>([]);
  const currentZoneId = useRef<string | null>(null);

  // Floating fireflies (golden particles)
  const fireflies = useRef<{ pos: THREE.Vector3; speed: number; phase: number; offset: THREE.Vector3 }[]>([]);
  const firefliesCount = 60;
  const fireflyPointsRef = useRef<THREE.Points>(null);

  // Initialize fireflies
  useMemo(() => {
    const list = [];
    for (let i = 0; i < firefliesCount; i++) {
      list.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 80,
          Math.random() * 15,
          (Math.random() - 0.5) * 80
        ),
        speed: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        offset: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          0,
          (Math.random() - 0.5) * 10
        ),
      });
    }
    fireflies.current = list;
  }, []);

  // 1. STEP ROOTS SPARKLE (Movement Trail)
  useEffect(() => {
    if (isMoving && !endingStarted) {
      const dist = playerPosition.distanceTo(lastStepPos.current);
      if (dist > 1.8) {
        lastStepPos.current.copy(playerPosition);
        const y = getTerrainHeight(playerPosition.x, playerPosition.z);
        const newRoot = {
          id: `step-${Date.now()}-${Math.random()}`,
          pos: [playerPosition.x, y, playerPosition.z] as [number, number, number],
          scale: 0.1,
        };

        setStepRoots((prev) => {
          const list = [...prev, newRoot];
          if (list.length > 30) list.shift(); // limit steps trail
          return list;
        });
      }
    }
  }, [playerPosition, isMoving, endingStarted]);

  // 2. STILLNESS ZONE GENERATOR
  // Generate branching root coordinates on terrain
  const generateRoots = (center: THREE.Vector3): RootSegment[] => {
    const segments: RootSegment[] = [];
    const maxDepth = 3;

    function branch(start: THREE.Vector3, angle: number, depth: number, delayStart: number) {
      if (depth > maxDepth) return;

      const length = 4.0 / depth + Math.random() * 1.5;
      const x = start.x + Math.sin(angle) * length;
      const z = start.z + Math.cos(angle) * length;
      const y = getTerrainHeight(x, z) - 0.05;
      const end = new THREE.Vector3(x, y, z);

      segments.push({
        start: start.clone(),
        end,
        growthTime: delayStart,
      });

      // Split into two branches
      const splitAngle = 0.3 + Math.random() * 0.4;
      branch(end, angle - splitAngle, depth + 1, delayStart + 0.2);
      branch(end, angle + splitAngle, depth + 1, delayStart + 0.25);
    }

    // Spawn branches in all directions
    const numDirections = 6;
    for (let i = 0; i < numDirections; i++) {
      const angle = (i / numDirections) * Math.PI * 2 + Math.random() * 0.4;
      branch(center, angle, 1, 0.0);
    }

    return segments;
  };

  // Generate flora (grass, flowers, trees) details around center
  const generateFlora = (center: THREE.Vector3): ForestItem[] => {
    const flora: ForestItem[] = [];
    const count = 45; // total items per zone

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 1.0 + Math.random() * 10;
      const x = center.x + Math.cos(angle) * dist;
      const z = center.z + Math.sin(angle) * dist;
      const y = getTerrainHeight(x, z);

      // Determine type based on distance and random distribution
      let type: "grass" | "flower" | "tree" = "grass";
      const rand = Math.random();

      if (rand > 0.85) {
        type = "tree"; // rare trees
      } else if (rand > 0.5) {
        type = "flower"; // flowers
      }

      let color = "#283722"; // muted green grass
      let maxScale = 0.4 + Math.random() * 0.4;

      if (type === "flower") {
        color = ["#bda26c", "#e3c485", "#c7b79a"][Math.floor(Math.random() * 3)]; // warm golds
        maxScale = 0.2 + Math.random() * 0.2;
      } else if (type === "tree") {
        color = "#131b10"; // dark green pines/spruces
        maxScale = 1.2 + Math.random() * 1.5;
      }

      flora.push({
        id: `flora-${i}-${Date.now()}-${Math.random()}`,
        type,
        position: [x, y, z],
        rotationY: Math.random() * Math.PI,
        color,
        maxScale,
        currentScale: 0.001,
      });
    }

    return flora;
  };

  // Manage creating and growing zones
  useEffect(() => {
    // When stillness starts (>= 2s) and we don't have a current zone active
    if (!isMoving && stillnessTime >= 2.0 && !currentZoneId.current) {
      const zoneId = `zone-${Date.now()}`;
      currentZoneId.current = zoneId;

      const newZone: GrowthZone = {
        id: zoneId,
        center: playerPosition.clone(),
        roots: generateRoots(playerPosition),
        flora: generateFlora(playerPosition),
        maxRadius: 12.0,
        createdTime: Date.now(),
      };

      setZones((prev) => {
        // Keep last 8 zones for performance
        const list = [...prev, newZone];
        if (list.length > 8) {
          return list.slice(list.length - 8);
        }
        return list;
      });
    }

    // Reset current zone lock when player moves again
    if (isMoving) {
      currentZoneId.current = null;
    }
  }, [isMoving, stillnessTime, playerPosition]);

  // Handle ending cinematic growth
  const endingTriggered = useRef(false);
  useEffect(() => {
    if (endingStarted && !endingTriggered.current) {
      endingTriggered.current = true;
      // Massive forest explosion centered at ancient tree [0, y, -100]
      const center = new THREE.Vector3(0, getTerrainHeight(0, -100), -100);
      const massiveZone: GrowthZone = {
        id: "ending-massive-zone",
        center,
        roots: [], // Draw lines directly or omit for speed
        flora: [],
        maxRadius: 120.0,
        createdTime: Date.now(),
      };

      // Populate massive zone flora
      const count = 350;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 2.0 + Math.random() * 80;
        const x = center.x + Math.cos(angle) * dist;
        const z = center.z + Math.sin(angle) * dist;
        const y = getTerrainHeight(x, z);

        let type: "grass" | "flower" | "tree" = "grass";
        const rand = Math.random();
        if (rand > 0.7) type = "tree";
        else if (rand > 0.4) type = "flower";

        let color = "#283722";
        let maxScale = 0.5 + Math.random() * 0.5;

        if (type === "flower") {
          color = "#e3c485";
          maxScale = 0.3 + Math.random() * 0.3;
        } else if (type === "tree") {
          color = "#182414";
          maxScale = 2.0 + Math.random() * 3.5;
        }

        massiveZone.flora.push({
          id: `ending-flora-${i}`,
          type,
          position: [x, y, z],
          rotationY: Math.random() * Math.PI,
          color,
          maxScale,
          currentScale: 0.001,
        });
      }

      // Generate massive root segments
      for (let i = 0; i < 40; i++) {
        const rAngle = Math.random() * Math.PI * 2;
        const length = 15 + Math.random() * 45;
        const endX = center.x + Math.cos(rAngle) * length;
        const endZ = center.z + Math.sin(rAngle) * length;
        massiveZone.roots.push({
          start: center.clone(),
          end: new THREE.Vector3(endX, getTerrainHeight(endX, endZ) - 0.1, endZ),
          growthTime: Math.random() * 0.3,
        });
      }

      setZones((prev) => [...prev, massiveZone]);
    }
  }, [endingStarted]);

  // 3. GROWTH FRAME ANIMATION LOOP
  useFrame((state, delta) => {
    // Animate moving trail (shrink/fade)
    setStepRoots((prev) =>
      prev
        .map((sr) => ({ ...sr, scale: Math.min(sr.scale + delta * 0.6, 1.0) }))
        .filter((sr) => sr.scale < 1.0) // remove fully grown step indicators quickly or fade them
    );

    // Animate zones flora scaling up based on stillness duration
    setZones((prevZones) =>
      prevZones.map((zone) => {
        // If it's the current zone, animate items according to actual stillness time
        const isCurrent = zone.id === currentZoneId.current || zone.id === "ending-massive-zone";
        if (!isCurrent) return zone; // static forest (growth frozen on movement)

        const timeInSeconds = zone.id === "ending-massive-zone" ? stillnessTime : stillnessTime - 2.0;

        const updatedFlora = zone.flora.map((item) => {
          let targetScale = 0;
          
          // Timeline of flora growth:
          // Grass grows immediately (timeInSeconds > 0)
          // Flowers grow after 3s (stillnessTime >= 5s)
          // Trees grow after 8s (stillnessTime >= 10s)
          if (item.type === "grass" && timeInSeconds > 0) {
            targetScale = item.maxScale;
          } else if (item.type === "flower" && timeInSeconds >= 3.0) {
            targetScale = item.maxScale;
          } else if (item.type === "tree" && timeInSeconds >= 8.0) {
            targetScale = item.maxScale;
          }

          // Smoothly scale up
          const growthSpeed = item.type === "tree" ? 0.3 : 1.2;
          const currentScale = THREE.MathUtils.lerp(
            item.currentScale,
            targetScale,
            reducedMotion ? 0.1 : growthSpeed * delta
          );

          return { ...item, currentScale };
        });

        return { ...zone, flora: updatedFlora };
      })
    );

    // Animate Floating Fireflies
    if (fireflyPointsRef.current) {
      const positions = fireflyPointsRef.current.geometry.attributes.position.array as Float32Array;
      const time = state.clock.getElapsedTime();

      fireflies.current.forEach((ff, i) => {
        // Animate up and sway
        ff.pos.y += ff.speed * delta;
        if (ff.pos.y > 15) {
          ff.pos.y = 0;
          ff.pos.x = playerPosition.x + (Math.random() - 0.5) * 60;
          ff.pos.z = playerPosition.z + (Math.random() - 0.5) * 60;
        }

        const swayX = Math.sin(time + ff.phase) * 0.1;
        const swayZ = Math.cos(time + ff.phase * 0.8) * 0.1;

        positions[i * 3] = ff.pos.x + swayX;
        positions[i * 3 + 1] = ff.pos.y;
        positions[i * 3 + 2] = ff.pos.z + swayZ;
      });

      fireflyPointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Render root lines using standard LineSegments
  const rootsLineGeometries = useMemo(() => {
    // Collect coordinates from all zones
    const linePairs: THREE.Vector3[] = [];

    zones.forEach((zone) => {
      // For each segment in the zone
      const isCurrent = zone.id === currentZoneId.current || zone.id === "ending-massive-zone";
      const progress = isCurrent ? Math.max(0, stillnessTime - 2.0) : 100; // static zones are fully grown

      zone.roots.forEach((seg) => {
        if (progress >= seg.growthTime) {
          linePairs.push(seg.start, seg.end);
        }
      });
    });

    return linePairs;
  }, [zones, stillnessTime]);

  return (
    <group>
      {/* 1. Step Roots Trail (Small rings glowing on floor) */}
      {stepRoots.map((sr) => (
        <mesh key={sr.id} position={sr.pos} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.0, 0.4 * sr.scale, 8]} />
          <meshBasicMaterial color="#bda26c" opacity={0.6 * (1.0 - sr.scale)} transparent />
        </mesh>
      ))}

      {/* 2. Procedural Stillness Roots (Lines branching out) */}
      {rootsLineGeometries.length > 0 && (
        <lineSegments>
          <bufferGeometry
            attach="geometry"
            onUpdate={(self) => {
              const positions = rootsLineGeometries.flatMap((v) => [v.x, v.y, v.z]);
              self.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
            }}
          />
          <lineBasicMaterial color="#bda26c" linewidth={2.0} transparent opacity={0.4} />
        </lineSegments>
      )}

      {/* 3. Flora Rendering (Grass, Flowers, Trees) */}
      {zones.map((zone) => (
        <group key={`flora-zone-${zone.id}`}>
          {zone.flora.map((item) => {
            if (item.currentScale <= 0.01) return null;

            if (item.type === "grass") {
              return (
                <mesh key={item.id} position={item.position} scale={[1, item.currentScale * 2, 1]}>
                  <coneGeometry args={[0.05, 1, 3]} />
                  <meshBasicMaterial color={item.color} />
                </mesh>
              );
            }

            if (item.type === "flower") {
              // A thin stem with a glowing bulb
              return (
                <group key={item.id} position={item.position}>
                  <mesh scale={[1, item.currentScale * 2, 1]}>
                    <cylinderGeometry args={[0.01, 0.01, 0.4]} />
                    <meshBasicMaterial color="#283722" />
                  </mesh>
                  <mesh position={[0, 0.4 * item.currentScale, 0]} scale={item.currentScale * 0.6}>
                    <dodecahedronGeometry args={[0.3, 0]} />
                    <meshBasicMaterial color={item.color} />
                  </mesh>
                </group>
              );
            }

            if (item.type === "tree") {
              // Stylized low poly pine tree
              return (
                <group key={item.id} position={item.position} rotation={[0, item.rotationY, 0]}>
                  {/* Trunk */}
                  <mesh position={[0, 0.5 * item.currentScale, 0]} scale={item.currentScale}>
                    <cylinderGeometry args={[0.08, 0.15, 1]} />
                    <meshStandardMaterial color="#2d251f" roughness={0.9} />
                  </mesh>
                  {/* Foliage */}
                  <mesh position={[0, 1.4 * item.currentScale, 0]} scale={item.currentScale}>
                    <coneGeometry args={[0.5, 1.8, 4]} />
                    <meshBasicMaterial color={item.color} />
                  </mesh>
                </group>
              );
            }

            return null;
          })}
        </group>
      ))}

      {/* 4. Meditative Floating Fireflies (Particles) */}
      <points ref={fireflyPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(firefliesCount * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#e3c485" // golden glow
          size={reducedMotion ? 0.08 : 0.12}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
