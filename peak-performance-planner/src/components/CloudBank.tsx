/**
 * CloudBank.tsx
 *
 * Dense cloud wall that travels down with the mountain sections.
 *
 * Approach (inspired by reference): each puff has its opacity baked at
 * creation time — no per-frame material animation. The group simply
 * exists in world space at whatever Y the parent sets each frame.
 * onPassThrough() fires once when the group's world-Y crosses 0
 * (avatar centre), triggering the background scenery swap.
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Puff {
  pos:     [number, number, number]
  r:       number
  scaleY:  number
  opacity: number
  color:   string
}

interface CloudBankProps {
  /** Parent sets position.y on this ref every frame */
  groupRef:       React.RefObject<THREE.Group | null>
  /** Fires once when the cloud centre crosses the avatar (group.position.y crosses 0) */
  onPassThrough?: () => void
}

export function CloudBank({ groupRef, onPassThrough }: CloudBankProps) {
  const passedRef = useRef(false)
  const prevY     = useRef<number | null>(null)

  // ── Build puffs once with baked opacity ──────────────────────
  const puffs = useMemo<Puff[]>(() => {
    const arr: Puff[] = []

    // Inner dense core — high opacity, large spheres
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = Math.random() * 20
      arr.push({
        pos:     [Math.cos(angle) * rad, (Math.random()*0.05 - 0.5), Math.sin(angle) * rad],
        r:       5 + Math.random() * 8,
        scaleY:  0.20 + Math.random() * 0.2,
        opacity: 0.82 + Math.random() * 0.16,   // 0.82 – 0.98
        color:   Math.random() > 0.5 ? '#e8eeff' : '#d8e4f8',
      })
    }

    // Mid ring — slightly smaller, still solid
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = 20 + Math.random() * 16
      arr.push({
        pos:     [Math.cos(angle) * rad, (Math.random()*0.05 - 0.5), Math.sin(angle) * rad],
        r:       4 + Math.random() * 3,
        scaleY:  0.25 + Math.random() * 0.10,
        opacity: 0.70 + Math.random() * 0.22,   // 0.70 – 0.92
        color:   Math.random() > 0.5 ? '#dde8ff' : '#ccd8f0',
      })
    }

    // Outer fringe — wispy, semi-transparent
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = 36 + Math.random() * 26
      arr.push({
        pos:     [Math.cos(angle) * rad, (Math.random()*0.05 - 0.5), Math.sin(angle) * rad],
        r:       3 + Math.random() * 3,
        scaleY:  0.1 + Math.random() * 0.12,
        opacity: 0.28 + Math.random() * 0.30,   // 0.28 – 0.58
        color:   '#ccd8ee',
      })
    }

    // Vertical column stuffers — fill top & bottom of the core wall
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = Math.random() * 18
      const ySign = Math.random() > 0.5 ? 1 : -1
      arr.push({
        pos:     [Math.cos(angle) * rad, Math.random(), Math.sin(angle) * rad],
        r:       4 + Math.random() * 3,
        scaleY:  0.3 + Math.random() * 0.10,
        opacity: 0.75 + Math.random() * 0.20,   // 0.75 – 0.95
        color:   '#e0eaff',
      })
    }

    return arr
  }, [])

  // ── Only job in useFrame: detect pass-through and fire callback ─
  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const cloudWorldY = group.position.y

    // group.position.y > 0 → cloud is above avatar (still approaching)
    // group.position.y ≤ 0 → cloud has passed the avatar
    const py = prevY.current
    if (py !== null && py > 0 && cloudWorldY <= 0 && !passedRef.current) {
      passedRef.current = true
      onPassThrough?.()
    }
    // Reset flag once the cloud is well above (ready for next cycle)
    if (cloudWorldY < -200) {
      passedRef.current = false
    }
    prevY.current = cloudWorldY
  })

  return (
    <group ref={groupRef}>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.pos} scale={[1, p.scaleY, 1]}>
          <sphereGeometry args={[p.r, 10, 8]} />
          <meshPhongMaterial
            color={p.color}
            transparent
            opacity={p.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}