import { forwardRef, useEffect, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const AVATAR_GLB = '/avatar.glb'  // drop your file in /public

interface AvatarProps {
  position: [number, number, number]
  scale?: number
  isClimbing?: boolean
}

export const Avatar = forwardRef<THREE.Group, AvatarProps>(
  ({ position, scale = 1, isClimbing = true }, ref) => {
    const group = useRef<THREE.Group>(null)
    const { scene, animations } = useGLTF(AVATAR_GLB)
    const { actions, names } = useAnimations(animations, group)

    // Wire the ref up
    useEffect(() => {
      if (ref && typeof ref !== 'function') ref.current = group.current
    }, [ref])

    // Traverse shadows
    useEffect(() => {
      group.current?.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).castShadow = true;
          (child as THREE.Mesh).receiveShadow = true
        }
      })
    }, [])

    useEffect(() => {
      group.current?.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.isMesh) {
          mesh.castShadow = true
          mesh.receiveShadow = true

          // Tint materials to match environment
          const mat = mesh.material as THREE.MeshStandardMaterial
          if (mat) {
            mat.color.multiplyScalar(1.3)        // slightly lighten
            mat.color.lerp(new THREE.Color('#a8c070'), 0.08)  // nudge toward scene greens
            mat.roughness = Math.min((mat.roughness ?? 0.5) + 0.2, 1)  // less shiny
            mat.needsUpdate = true
          }
        }
      })
    }, [])

    // Switch between walk and idle
    useEffect(() => {
      const walkAction = actions[names.find(n => n.toLowerCase().includes('walk')) ?? names[0]]
      const idleAction = actions[names.find(n => n.toLowerCase().includes('idle')) ?? names[0]]

      if (isClimbing) {
        idleAction?.fadeOut(0.3)
        walkAction?.reset().fadeIn(0.3).play()
      } else {
        walkAction?.fadeOut(0.3)
        idleAction?.reset().fadeIn(0.3).play()
      }
    }, [isClimbing, actions, names])

    
    return (
      <group ref={group} position={position} scale={0.3} rotation={[0, Math.PI*0.87, 0]}>
        <primitive object={scene} />
      </group>
    )
  }
  )

Avatar.displayName = 'Avatar'
useGLTF.preload(AVATAR_GLB)