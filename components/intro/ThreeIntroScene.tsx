"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// Center 3D Shopping Bag / Kartiva Emblem
function CenterEmblem() {
  const bagRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bagRef.current) {
      bagRef.current.rotation.y += delta * 0.75;
      bagRef.current.rotation.x = Math.sin(Date.now() * 0.0015) * 0.12;
    }
  });

  return (
    <group ref={bagRef} position={[0, 0, 0]}>
      {/* Shopping Bag Main Body */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[1.5, 1.7, 0.9]} />
        <meshPhysicalMaterial
          color="#3525cd"
          roughness={0.25}
          metalness={0.65}
          clearcoat={0.8}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* Bag Trim / Top Opening */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.54, 0.08, 0.94]} />
        <meshStandardMaterial color="#6366f1" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Bag Handle (Torus arched over top) */}
      <mesh position={[0, 0.85, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.45, 0.06, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#fd6a49" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Front Golden "K" Badge */}
      <group position={[0, -0.15, 0.47]}>
        <mesh>
          <circleGeometry args={[0.42, 32]} />
          <meshStandardMaterial
            color="#1e1b4b"
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
        <Text
          position={[0, -0.02, 0.02]}
          fontSize={0.5}
          color="#fbbf24"
          font="/fonts/Inter-Bold.ttf"
          anchorX="center"
          anchorY="middle"
        >
          K
        </Text>
      </group>
    </group>
  );
}

// Orbiting Category Objects
interface OrbitItemProps {
  initialAngle: number;
  radius: number;
  speed: number;
  color: string;
  type: "book" | "shirt" | "audio" | "home" | "sports";
}

function OrbitProduct({ initialAngle, radius, speed, color, type }: OrbitItemProps) {
  const meshRef = useRef<THREE.Group>(null);
  const angleRef = useRef(initialAngle);

  useFrame((_, delta) => {
    angleRef.current += delta * speed;
    if (meshRef.current) {
      const x = Math.cos(angleRef.current) * radius;
      const z = Math.sin(angleRef.current) * radius;
      const y = Math.sin(angleRef.current * 2) * 0.28;
      meshRef.current.position.set(x, y, z);
      meshRef.current.rotation.y += delta * 1.5;
      meshRef.current.rotation.x += delta * 0.8;
    }
  });

  return (
    <group ref={meshRef}>
      {type === "book" && (
        <mesh castShadow>
          <boxGeometry args={[0.45, 0.58, 0.14]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
        </mesh>
      )}

      {type === "shirt" && (
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.5, 0.25]} />
          <MeshDistortMaterial
            color={color}
            speed={1.5}
            distort={0.15}
            roughness={0.4}
          />
        </mesh>
      )}

      {type === "audio" && (
        <group>
          <mesh castShadow>
            <torusGeometry args={[0.22, 0.07, 12, 24]} />
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      )}

      {type === "home" && (
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.26, 0.48, 16]} />
          <meshStandardMaterial color={color} roughness={0.15} metalness={0.6} />
        </mesh>
      )}

      {type === "sports" && (
        <mesh castShadow>
          <dodecahedronGeometry args={[0.26]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
        </mesh>
      )}
    </group>
  );
}

export default function ThreeIntroScene() {
  const products: OrbitItemProps[] = [
    { initialAngle: 0, radius: 2.3, speed: 0.65, color: "#10b981", type: "book" },
    { initialAngle: (2 * Math.PI) / 5, radius: 2.3, speed: 0.65, color: "#fd6a49", type: "shirt" },
    { initialAngle: (4 * Math.PI) / 5, radius: 2.3, speed: 0.65, color: "#818cf8", type: "audio" },
    { initialAngle: (6 * Math.PI) / 5, radius: 2.3, speed: 0.65, color: "#f59e0b", type: "home" },
    { initialAngle: (8 * Math.PI) / 5, radius: 2.3, speed: 0.65, color: "#06b6d4", type: "sports" },
  ];

  return (
    <div className="w-72 h-72 sm:w-96 sm:h-96 relative">
      <Canvas
        camera={{ position: [0, 0.8, 5], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        className="w-full h-full pointer-events-none"
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 5]} intensity={1.8} castShadow />
        <pointLight position={[-4, -3, -2]} intensity={0.8} color="#fd6a49" />
        <pointLight position={[3, -2, 3]} intensity={1.2} color="#818cf8" />

        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
          <CenterEmblem />
        </Float>

        {products.map((p, idx) => (
          <OrbitProduct key={idx} {...p} />
        ))}
      </Canvas>
    </div>
  );
}
