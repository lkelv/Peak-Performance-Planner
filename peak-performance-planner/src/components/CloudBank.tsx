/**
 * CloudBank.tsx
 *
 * A dense, high-opacity cloud wall that:
 *  1. Is placed inside worldRef and travels DOWN with the mountain sections
 *     at the same CLIMB_SPEED — it is a real world object, not a HUD effect.
 *  2. Fades in as the player approaches, goes fully opaque as they pass
 *     through, then fades out behind them.
 *  3. Calls onPassThrough() once per cloud event so the parent can swap
 *     the background scenery generation.
 *
 * The parent (MountainWorld) sets cloudY directly every frame via the
 * groupRef it passes in, just like it does for mountain sections.
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// How many world-units above/below cloud centre the fade spans
const FADE_IN_DIST  = 12   // start fading in this far below cloud centre
const FADE_OUT_DIST = 10   // fully gone this far above cloud centre
const CORE_HALF     = 6    // fully opaque within this dist of cloud centre
const MAX_OPACITY   = 0.96

interface Puff {
  pos:    [number, number, number]
  r:      number
  scaleY: number
}

interface CloudBankProps {
  /** Outer group ref — parent sets position.y every frame */
  groupRef:       React.RefObject<THREE.Group | null>
  /** Called once when the avatar centre crosses the cloud (y passes 0 in local space) */
  onPassThrough?: () => void
}

export function CloudBank({ groupRef, onPassThrough }: CloudBankProps) {
  const matsRef   = useRef<THREE.MeshStandardMaterial[]>([])
  const passedRef = useRef(false)
  const prevY     = useRef<number | null>(null)

  const puffs = useMemo<Puff[]>(() => {
    const arr: Puff[] = []
    // Inner dense core
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = Math.random() * 18
      arr.push({
        pos:    [Math.cos(angle) * rad, (Math.random() - 0.5) * 6, Math.sin(angle) * rad],
        r:      4 + Math.random() * 6,
        scaleY: 0.35 + Math.random() * 0.30,
      })
    }
    // Outer fringe
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = 18 + Math.random() * 20
      arr.push({
        pos:    [Math.cos(angle) * rad, (Math.random() - 0.5) * 4, Math.sin(angle) * rad],
        r:      3 + Math.random() * 5,
        scaleY: 0.25 + Math.random() * 0.22,
      })
    }
    return arr
  }, [])

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    // Avatar is fixed at world-space y ≈ 0.
    // cloudWorldY > 0  = cloud is above avatar (coming down toward it)
    // cloudWorldY < 0  = cloud has passed the avatar
    const cloudWorldY = group.position.y

    let opacity = 0
    if (cloudWorldY > 0 && cloudWorldY < FADE_IN_DIST) {
      opacity = 1 - cloudWorldY / FADE_IN_DIST
    } else if (cloudWorldY <= 0 && cloudWorldY > -CORE_HALF) {
      opacity = 1
    } else if (cloudWorldY <= -CORE_HALF && cloudWorldY > -(CORE_HALF + FADE_OUT_DIST)) {
      opacity = 1 - (Math.abs(cloudWorldY) - CORE_HALF) / FADE_OUT_DIST
    }

    opacity = Math.max(0, Math.min(1, opacity)) * MAX_OPACITY
    matsRef.current.forEach(m => { m.opacity = opacity })

    // Fire onPassThrough once as cloud centre crosses avatar (pos.y goes + → -)
    const py = prevY.current
    if (py !== null && py > 0 && cloudWorldY <= 0 && !passedRef.current) {
      passedRef.current = true
      onPassThrough?.()
    }
    // Reset flag when cloud is fully gone above
    if (cloudWorldY < -(CORE_HALF + FADE_OUT_DIST + 5)) {
      passedRef.current = false
    }
    prevY.current = cloudWorldY
  })

  return (
    <group ref={groupRef}>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.pos} scale={[1, p.scaleY, 1]}>
          <sphereGeometry args={[p.r, 9, 7]} />
          <meshStandardMaterial
            ref={el => { if (el) matsRef.current[i] = el }}
            color="#dde8ff"
            transparent
            opacity={0}
            roughness={1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}