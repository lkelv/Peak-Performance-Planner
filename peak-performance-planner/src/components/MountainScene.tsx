/**
 * MountainScene.tsx  (updated)
 *
 * Drop-in replacement for the original MountainScene.
 * Swaps out the procedural World / Floor system for the
 * GLB-based MountainWorld with alternating Left / Right halves.
 *
 * Usage:
 *   <MountainScene goalName="Complete Semester 1" isClimbing={timerRunning} />
 */

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { SkyScene } from './SkyScene'
import { MountainWorld } from './MountainWorld'
import { HUD } from './HUD'
import { CAM_POS, CAM_FOV } from './constants'

interface MountainSceneProps {
  goalName?:  string
  height?:    number
  /** Pass false to pause climbing (e.g. timer stopped / break mode) */
  isClimbing?: boolean
}

export default function MountainScene({
  goalName   = 'Complete Semester 1',
  height     = 600,
  isClimbing = true,
}: MountainSceneProps) {
  const [section, setSection] = useState(1)

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <Canvas
        camera={{
          position: CAM_POS.toArray() as [number, number, number],
          fov: CAM_FOV,
          near: 0.05,
          far: 600,
        }}
        shadows
      >
        {/* ── Lighting ── */}
        <ambientLight color="#c8ddf0" intensity={1.8} />
        <directionalLight
          position={[40, 80, 30]}
          color="#fff8e8"
          intensity={2.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <hemisphereLight args={['#aad4f5', '#4a7a30', 0.9]} />

        {/* ── Sky dome + decorative clouds ── */}
        <SkyScene />

        {/* ── Mountain world — GLB halves + avatar ── */}
        <Suspense fallback={null}>
          <MountainWorld
            isClimbing={isClimbing}
            onSectionChange={setSection}
          />
        </Suspense>
      </Canvas>

      {/* ── HUD overlay ── */}
      <HUD goalName={goalName} floor={section} />
    </div>
  )
}
