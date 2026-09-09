import React, { useMemo } from "react";
import * as THREE from "three";

// Height function for terrain - deterministic and fast
export function getTerrainHeight(x: number, z: number): number {
  return (
    Math.sin(x * 0.04) * Math.cos(z * 0.04) * 2.2 +
    Math.sin(x * 0.015) * 2.5 +
    Math.cos(z * 0.025) * 1.2
  );
}

export function Terrain() {
  const segments = 120;
  const size = 300;

  // Generate displaced grid for the painterly landscape
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2); // align flat on XZ plane

    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = getTerrainHeight(x, z);
      posAttr.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Generate small stones scattered in the world
  const stones = useMemo(() => {
    const list = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      // Scatter in a radius around the origin
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 120;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getTerrainHeight(x, z) - 0.1; // sink slightly into earth

      const scaleX = 0.3 + Math.random() * 0.7;
      const scaleY = 0.15 + Math.random() * 0.45;
      const scaleZ = 0.3 + Math.random() * 0.7;
      const rotationY = Math.random() * Math.PI;

      list.push({
        id: i,
        position: [x, y, z] as [number, number, number],
        scale: [scaleX, scaleY, scaleZ] as [number, number, number],
        rotation: [0, rotationY, 0] as [number, number, number],
      });
    }
    return list;
  }, []);

  // Generate static roots trunks lying on the ground
  const ancientRoots = useMemo(() => {
    const list = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 15 + Math.random() * 110;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getTerrainHeight(x, z) - 0.2;

      const scale = 0.4 + Math.random() * 0.8;
      const rotX = (Math.random() - 0.5) * 0.3;
      const rotY = Math.random() * Math.PI * 2;
      const rotZ = (Math.random() - 0.5) * 0.3;

      list.push({
        id: i,
        position: [x, y, z] as [number, number, number],
        scale: [scale, scale, scale * (1.5 + Math.random() * 2)] as [number, number, number],
        rotation: [rotX, rotY, rotZ] as [number, number, number],
      });
    }
    return list;
  }, []);

  return (
    <group>
      {/* Ground mesh with dark earth coloring */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color="#0d0c0a" // deep black-brown
          roughness={0.9}
          metalness={0.1}
          flatShading={false}
        />
      </mesh>

      {/* Small scattered stones */}
      {stones.map((stone) => (
        <mesh
          key={`stone-${stone.id}`}
          position={stone.position}
          scale={stone.scale}
          rotation={stone.rotation}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color="#1b1814" // slightly lighter earth brown
            roughness={0.95}
            metalness={0.0}
          />
        </mesh>
      ))}

      {/* Ancient roots trunks details */}
      {ancientRoots.map((root) => (
        <mesh
          key={`root-${root.id}`}
          position={root.position}
          scale={root.scale}
          rotation={root.rotation}
          castShadow
        >
          <cylinderGeometry args={[0.2, 0.12, 6, 8]} />
          <meshStandardMaterial
            color="#1c1914" // dark wood
            roughness={0.9}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}
