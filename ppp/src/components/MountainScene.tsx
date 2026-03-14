import { Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { SkyScene } from './SkyScene'
import { MountainWorld } from './MountainWorld'
import { CAM_POS, CAM_FOV } from './constants'
import * as THREE from 'three'

interface MountainSceneProps {
    height?:     number
    isClimbing?: boolean
    viewMode?:   'wide' | 'close'
}

function CameraController({ viewMode }: { viewMode: 'wide' | 'close' }) {
    const { camera } = useThree()
    const closePos = useMemo(() => CAM_POS.clone(), [])
    const widePos = useMemo(() => new THREE.Vector3(closePos.x + 15, closePos.y + 10, closePos.z + 25), [closePos])

    useFrame((_state, delta) => {
        const targetPos = viewMode === 'wide' ? widePos : closePos;
        camera.position.lerp(targetPos, delta * 2.5);
    })
    return null;
}

export default function MountainScene({
                                          height     = window.innerHeight,
                                          isClimbing = true,
                                          viewMode   = 'close'
                                      }: MountainSceneProps) {
    return (
        <div style={{ width: '100%', height, position: 'relative' }}>
            <Canvas
                shadows
                camera={{
                    position: viewMode === 'wide' ? [45, 25, 55] : (CAM_POS.toArray() as [number, number, number]),
                    fov: CAM_FOV,
                    near: 0.05,
                    far: 600,
                }}
            >
                <CameraController viewMode={viewMode} />
                <ambientLight color="#c8ddf0" intensity={1.8} />
                <directionalLight position={[40, 80, 30]} color="#fff8e8" intensity={3.5} castShadow />
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