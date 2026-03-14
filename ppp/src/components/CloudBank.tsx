/**
 * CloudBank.tsx
 *
 * Dense cloud wall that travels down with the mountain sections.
 * Each puff has its opacity baked at creation — no per-frame material
 * animation. The group Y is set by the parent (MountainWorld) every frame.
 * onPassThrough() fires once when the group crosses world-Y = 0 (avatar).
 */

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
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
  groupRef:       React.RefObject<THREE.Group | null>
  onPassThrough?: () => void
}

export function CloudBank({ groupRef, onPassThrough }: CloudBankProps) {
  const passedRef = useRef(false)
  const prevY     = useRef<number | null>(null)

  const puffs = useMemo<Puff[]>(() => {
    const arr: Puff[] = []

    // Inner dense core — high opacity, large spheres
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = Math.random() * 20
      arr.push({
        pos:     [Math.cos(angle) * rad, Math.random() * 0.05 - 0.5, Math.sin(angle) * rad],
        r:       5 + Math.random() * 8,
        scaleY:  0.20 + Math.random() * 0.2,
        opacity: 0.82 + Math.random() * 0.16,
        color:   Math.random() > 0.5 ? '#e8eeff' : '#d8e4f8',
      })
    }

    // Mid ring — slightly smaller, still solid
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = 20 + Math.random() * 16
      arr.push({
        pos:     [Math.cos(angle) * rad, Math.random() * 0.05 - 0.5, Math.sin(angle) * rad],
        r:       4 + Math.random() * 3,
        scaleY:  0.25 + Math.random() * 0.10,
        opacity: 0.70 + Math.random() * 0.22,
        color:   Math.random() > 0.5 ? '#dde8ff' : '#ccd8f0',
      })
    }

    // Outer fringe — wispy, semi-transparent
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = 36 + Math.random() * 26
      arr.push({
        pos:     [Math.cos(angle) * rad, Math.random() * 0.05 - 0.5, Math.sin(angle) * rad],
        r:       3 + Math.random() * 3,
        scaleY:  0.10 + Math.random() * 0.12,
        opacity: 0.28 + Math.random() * 0.30,
        color:   '#ccd8ee',
      })
    }

    // Column stuffers — fill top & bottom edge of the wall
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = Math.random() * 18
      arr.push({
        pos:     [Math.cos(angle) * rad, Math.random(), Math.sin(angle) * rad],
        r:       4 + Math.random() * 3,
        scaleY:  0.30 + Math.random() * 0.10,
        opacity: 0.75 + Math.random() * 0.20,
        color:   '#e0eaff',
      })
    }

    return arr
  }, [])

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const cloudWorldY = group.position.y
    const py = prevY.current

    // Fire when the cloud centre is 4 units past the avatar (still mid-whiteout)
    // rather than the moment it crosses 0, so the swap happens while the screen
    // is fully covered and the new mountains are hidden behind the cloud wall.
    if (py !== null && py > -4 && cloudWorldY <= -4 && !passedRef.current) {
      passedRef.current = true
      onPassThrough?.()
    }

    // Reset once the cloud is well above the avatar again (positive Y = above).
    // A small positive threshold means the flag clears as soon as the cloud
    // has been recycled back to the top, ready for the next pass.
    if (cloudWorldY > 10) {
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