/**
 * MountainScene.tsx
 *
 * Top-level canvas wrapper.
 * Passes isClimbing down to MountainWorld to start/stop the scroll.
 *
 * Usage:
 *   <MountainScene goalName="Complete Semester 1" isClimbing={timerRunning} />
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { SkyScene } from './SkyScene'
import { MountainWorld } from './MountainWorld'
import { CAM_POS, CAM_FOV } from './constants'
import * as THREE from 'three'

interface MountainSceneProps {
  height?:     number
  /** false = avatar idles, world stops scrolling */
  isClimbing?: boolean
}

export default function MountainScene({
  height     = 600,
  isClimbing = true,
}: MountainSceneProps) {
  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <Canvas
        shadows
        
        camera={{
          position: CAM_POS.toArray() as [number, number, number],
          fov: CAM_FOV,
          near: 0.05,
          far: 600,
        }}
      >
        <ambientLight color="#c8ddf0" intensity={1.8} />
        
        <directionalLight
          position={[40, 80, 30]}
          color="#fff8e8"
          intensity={3.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0005}
          shadow-radius={5}
          shadow-camera-near={0.1}
          shadow-camera-far={200}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />
        <directionalLight position={[-20, 20, -10]} intensity={0.6} color="#c8d8f0" />
        <hemisphereLight args={['#aad4f5', '#4a7a30', 0.9]} />

        <SkyScene />

        <Suspense fallback={null}>
          <MountainWorld isClimbing={isClimbing} />
        </Suspense>
      </Canvas>
    </div>
  )
}