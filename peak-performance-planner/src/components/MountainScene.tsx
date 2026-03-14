/**
 * MountainScene.tsx
 *
 * Top-level canvas wrapper.  Drop-in replacement for the original.
 * Passes isClimbing down to MountainWorld to start/stop the scroll.
 *
 * Usage:
 *   <MountainScene goalName="Complete Semester 1" isClimbing={timerRunning} />
 */

import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { SkyScene } from './SkyScene'
import { MountainWorld } from './MountainWorld'
import { HUD } from './HUD'
import { CAM_POS, CAM_FOV } from './constants'

interface MountainSceneProps {
  goalName?:   string
  height?:     number
  /** false = avatar idles, world stops scrolling */
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
        <ambientLight color="#c8ddf0" intensity={1.8} />
        <directionalLight
          position={[40, 80, 30]}
          color="#fff8e8"
          intensity={2.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <hemisphereLight args={['#aad4f5', '#4a7a30', 0.9]} />

        <SkyScene />

        <Suspense fallback={null}>
          <MountainWorld
            isClimbing={isClimbing}
            onSectionChange={setSection}
          />
        </Suspense>
      </Canvas>

      <HUD goalName={goalName} floor={section} />
    </div>
  )
}
