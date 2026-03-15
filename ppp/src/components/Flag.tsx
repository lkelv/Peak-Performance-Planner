/**
 * Flag.tsx
 *
 * 3D flag that spawns on the mountain when a milestone is reached.
 * Two spawn modes:
 *   - "pop"  (Scenario A): scales from 0→1 with a spring bounce
 *   - "rise" (Scenario B): translates up from below ground smoothly
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  FLAG_POLE_HEIGHT,
  FLAG_POLE_RADIUS,
  FLAG_CLOTH_WIDTH,
  FLAG_CLOTH_HEIGHT,
} from './constants'

interface FlagProps {
  /** World-space position for the flag base */
  position: [number, number, number]
  /** "pop" = spring scale (early finish), "rise" = rise from ground (timer expiry) */
  mode: 'pop' | 'rise'
  /** Colour of the flag cloth */
  color?: string
}

export function Flag({ position, mode, color = '#33bb55' }: FlagProps) {
  const groupRef = useRef<THREE.Group>(null)
  const progressRef = useRef(0)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    progressRef.current = Math.min(progressRef.current + delta * 1.8, 1)
    const t = progressRef.current

    if (mode === 'pop') {
      // Spring / bounce scale effect
      // overshoot to 1.2 then settle to 1.0
      let scale: number
      if (t < 0.6) {
        scale = (t / 0.6) * 1.25       // overshoot to 1.25
      } else {
        scale = 1.25 - 0.25 * ((t - 0.6) / 0.4)  // settle to 1.0
      }
      groupRef.current.scale.setScalar(Math.max(0, scale))
    } else {
      // Rise from ground
      const riseOffset = (1 - t) * -FLAG_POLE_HEIGHT
      groupRef.current.position.y = position[1] + riseOffset
      groupRef.current.scale.setScalar(1)
    }
  })

  const startScale = mode === 'pop' ? 0 : 1

  return (
    <group
      ref={groupRef}
      position={position}
      scale={startScale}
    >
      {/* Pole */}
      <mesh position={[0, FLAG_POLE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[FLAG_POLE_RADIUS, FLAG_POLE_RADIUS, FLAG_POLE_HEIGHT, 6]} />
        <meshPhongMaterial color="#cccccc" />
      </mesh>

      {/* Flag cloth */}
      <mesh position={[FLAG_CLOTH_WIDTH / 2, FLAG_POLE_HEIGHT * 0.85, 0]}>
        <planeGeometry args={[FLAG_CLOTH_WIDTH, FLAG_CLOTH_HEIGHT]} />
        <meshPhongMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      {/* Small golden ball on top */}
      <mesh position={[0, FLAG_POLE_HEIGHT + 0.04, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshPhongMaterial color="#f0c060" />
      </mesh>
    </group>
  )
}
