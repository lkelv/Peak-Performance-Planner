import { forwardRef, useEffect, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import type { AvatarState } from './constants'

const AVATAR_GLB = '/avatar.glb'  // drop your file in /public

interface AvatarProps {
  position: [number, number, number]
  scale?: number
  isClimbing?: boolean
  avatarState?: AvatarState
}

export const Avatar = forwardRef<THREE.Group, AvatarProps>(
  ({ position = 1, isClimbing = true, avatarState = 'WALKING' }, ref) => {
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

    // Switch animations based on avatar state
    useEffect(() => {
      const walkName = names.find(n => n.toLowerCase().includes('walk')) ?? names[0]
      const idleName = names.find(n => n.toLowerCase().includes('idle')) ?? names[0]
      const walkAction = actions[walkName]
      const idleAction = actions[idleName]

      // Fade out all first
      walkAction?.fadeOut(0.3)
      idleAction?.fadeOut(0.3)

      switch (avatarState) {
        case 'SPRINTING':
          // Sprint = walk animation at 2x speed
          if (walkAction) {
            walkAction.timeScale = 2.0
            walkAction.reset().fadeIn(0.3).play()
          }
          break
        case 'WALKING':
          if (walkAction) {
            walkAction.timeScale = 1.0
            walkAction.reset().fadeIn(0.3).play()
          }
          break
        case 'CELEBRATING':
        case 'IDLE':
        default:
          if (idleAction) {
            idleAction.reset().fadeIn(0.3).play()
          }
          break
      }
    }, [avatarState, actions, names])

    // Fallback: also respond to isClimbing for non-milestone states
    useEffect(() => {
      if (avatarState !== 'WALKING' && avatarState !== 'SPRINTING') return
      const walkAction = actions[names.find(n => n.toLowerCase().includes('walk')) ?? names[0]]
      const idleAction = actions[names.find(n => n.toLowerCase().includes('idle')) ?? names[0]]

      if (isClimbing) {
        idleAction?.fadeOut(0.3)
        walkAction?.reset().fadeIn(0.3).play()
      } else {
        walkAction?.fadeOut(0.3)
        idleAction?.reset().fadeIn(0.3).play()
      }
    }, [isClimbing, actions, names, avatarState])


    return (
      <group ref={group} position={position} scale={0.3} rotation={[0, Math.PI*0.87, 0]}>
        <primitive object={scene} />
      </group>
    )
  }
  )

Avatar.displayName = 'Avatar'
useGLTF.preload(AVATAR_GLB)