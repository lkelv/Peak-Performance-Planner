import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { SkyScene } from './SkyScene'
import { World } from './World'
import { HUD } from './HUD'
import { CAM_POS, CAM_FOV } from './constants'

interface MountainSceneProps {
  goalName?: string
  height?: number
}

export default function MountainScene({ goalName, height = 600 }: MountainSceneProps) {
  const [floor, setFloor] = useState(1)

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
        {/* Bright daytime lighting */}
        <ambientLight color="#c8ddf0" intensity={1.8} />
        <directionalLight
          position={[40, 80, 30]}
          color="#fff8e8"
          intensity={2.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        {/* Sky/ground hemisphere fill */}
        <hemisphereLight args={['#aad4f5', '#4a7a30', 0.9]} />

        <SkyScene />
        <World onFloorChange={setFloor} />
      </Canvas>

      <HUD goalName={goalName} floor={floor} />
    </div>
  )
}
