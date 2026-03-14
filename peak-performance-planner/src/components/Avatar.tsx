import { forwardRef } from 'react'
import * as THREE from 'three'

interface AvatarProps {
  position: [number, number, number]
  scale?: number
}

export const Avatar = forwardRef<THREE.Group, AvatarProps>(({ position, scale = 1 }, ref) => (
  <group ref={ref} position={position} scale={scale}>
    {/* Left leg  — index 0 (leg bob target) */}
    <mesh position={[-0.07, 0.08, 0]}>
      <cylinderGeometry args={[0.055, 0.06, 0.30, 6]} />
      <meshStandardMaterial color="#1e2e4a" roughness={0.8} />
    </mesh>

    {/* Right leg — index 1 (leg bob target) */}
    <mesh position={[0.07, 0.08, 0]}>
      <cylinderGeometry args={[0.055, 0.06, 0.30, 6]} />
      <meshStandardMaterial color="#1e2e4a" roughness={0.8} />
    </mesh>

    {/* Torso */}
    <mesh position={[0, 0.38, 0]}>
      <cylinderGeometry args={[0.12, 0.14, 0.38, 8]} />
      <meshStandardMaterial color="#1a4a8a" roughness={0.7} />
    </mesh>

    {/* Head */}
    <mesh position={[0, 0.74, 0]}>
      <sphereGeometry args={[0.14, 12, 12]} />
      <meshStandardMaterial color="#c07850" roughness={0.6} />
    </mesh>

    {/* Backpack */}
    <mesh position={[0, 0.42, -0.15]}>
      <boxGeometry args={[0.20, 0.30, 0.13]} />
      <meshStandardMaterial color="#7a3a0e" roughness={0.9} />
    </mesh>

    {/* Left arm */}
    <mesh position={[-0.19, 0.37, 0]} rotation={[0, 0, -0.35]}>
      <cylinderGeometry args={[0.044, 0.044, 0.30, 5]} />
      <meshStandardMaterial color="#1a4a8a" roughness={0.7} />
    </mesh>

    {/* Right arm */}
    <mesh position={[0.19, 0.37, 0]} rotation={[0, 0, 0.35]}>
      <cylinderGeometry args={[0.044, 0.044, 0.30, 5]} />
      <meshStandardMaterial color="#1a4a8a" roughness={0.7} />
    </mesh>

    {/* Hat brim */}
    <mesh position={[0, 0.87, 0]}>
      <cylinderGeometry args={[0.20, 0.20, 0.04, 12]} />
      <meshStandardMaterial color="#3a2810" roughness={0.9} />
    </mesh>

    {/* Hat crown */}
    <mesh position={[0, 0.97, 0]}>
      <cylinderGeometry args={[0.13, 0.16, 0.18, 12]} />
      <meshStandardMaterial color="#3a2810" roughness={0.9} />
    </mesh>
  </group>
))

Avatar.displayName = 'Avatar'
