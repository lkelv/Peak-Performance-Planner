/**
 * MountainWorld.tsx
 *
 * ── Mountain sections ────────────────────────────────────────────
 *  5 GLB slots in a circular buffer. Recycling is POSITION-BASED:
 *  as soon as the bottom slot's Y drops below RECYCLE_THRESHOLD
 *  (halfway between the player and off-screen), it teleports to the
 *  top — guaranteeing a fresh section is always well ahead of the
 *  player before they can see the edge.
 *
 * ── Background scrolling ────────────────────────────────────────
 *  bgRef lives OUTSIDE worldRef. Each frame we mirror worldRef's
 *  rotation AND apply the same Y translation so trees/mountains
 *  scroll at identical speed. bgGeneration key remounts scenery
 *  after each cloud passage.
 *
 * ── Cloud bank ──────────────────────────────────────────────────
 *  cloudRef travels DOWN at CLIMB_SPEED like a mountain section.
 *  It resets above the top section every CLOUD_SPAWN_INTERVAL recycles.
 *  Passing through it swaps the background scenery generation.
 */

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  CAM_POS, CAM_LOOK, CAM_FOV,
  AVATAR_POS, AVATAR_SCALE,
  WORLD_OFFSET_X, WORLD_OFFSET_Y, WORLD_OFFSET_Z,
  ROTATION_DIR,
  SECTION_HEIGHT,
  RECYCLE_THRESHOLD,
  CLIMB_SPEED, ROT_SPEED,
  CLOUD_SPAWN_INTERVAL,
  CLOUD_ABOVE_OFFSET,
} from './constants'
import { Avatar } from './Avatar'
import { CloudBank } from './CloudBank'
import { MountainSection } from './MountainHalf'

// ─────────────────────────────────────────────────────────────────
// Background scenery — randomised per generation
// ─────────────────────────────────────────────────────────────────

function seededRand(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

function makeScenery(generation: number) {
  const rng = seededRand(generation * 7919 + 1)

  const PEAK_PALETTES = [
    [0x2a3f1e, 0x253818, 0x2d4220, 0x1e3012, 0x344a22],
    [0x3a5a2a, 0x4a6a38, 0x508040, 0x2e4a20, 0x5a7048],
    [0x6a7a5a, 0x7a8a68, 0x8a9a78, 0x5a6a4a, 0x909e80],
    [0x8a8a9a, 0x9a9aaa, 0xaaaacc, 0x7a7a8a, 0xb0b0cc],
    [0xaabbcc, 0xbbccdd, 0xccdded, 0x99aabb, 0xddeeff],
  ]
  const palette = PEAK_PALETTES[generation % PEAK_PALETTES.length]

  // ── Far background ring (large, distant peaks) ──
  const farPeaks: [number, number, number, number, number][] = Array.from({ length: 20 }, () => {
    const angle = rng() * Math.PI * 2
    const dist  = 70 + rng() * 60   // 70-130 units out
    const r     = 14 + rng() * 20
    const h     = 35 + rng() * 50
    const col   = palette[Math.floor(rng() * palette.length)]
    return [Math.cos(angle) * dist, Math.sin(angle) * dist, r, h, col]
  })

  // ── Mid ring (medium peaks, mid distance) ──
  const midPeaks: [number, number, number, number, number][] = Array.from({ length: 20 }, () => {
    const angle = rng() * Math.PI * 2
    const dist  = 35 + rng() * 35   // 35-70 units out
    const r     = 9 + rng() * 14
    const h     = 20 + rng() * 35
    const col   = palette[Math.floor(rng() * palette.length)]
    return [Math.cos(angle) * dist, Math.sin(angle) * dist, r, h, col]
  })

  // ── Near ring (small hills, close) ──
  const nearPeaks: [number, number, number, number, number][] = Array.from({ length: 14 }, () => {
    const angle = rng() * Math.PI * 2
    const dist  = 25 + rng() * 18   // 20-38 units out
    const r     = 5 + rng() * 8
    const h     = 10 + rng() * 18
    const col   = palette[Math.floor(rng() * palette.length)]
    return [Math.cos(angle) * dist, Math.sin(angle) * dist, r, h, col]
  })

  // ── Snow-capped tops for taller far peaks ──
  const snowCaps: [number, number, number, number][] = farPeaks
    .filter(([,, , h]) => h > 55)
    .map(([x, z, r, h]) => [x, z, r * 0.3, h * 0.18])

  // ── Trees: dense forest ring ──
  const TREE_COLS_BY_GEN = [
    ['#2a5a1a', '#2f6a20', '#336620', '#3a7226', '#1e4a12'],
    ['#3a6a2a', '#4a7a38', '#508040', '#2e5a20', '#6a8050'],
    ['#5a6a4a', '#6a7a58', '#7a8a68', '#4a5a3a', '#8a9a78'],
    ['#7a8a8a', '#8a9a9a', '#9aaaaa', '#6a7a7a', '#aababa'],
    ['#8a9aaa', '#9aaacc', '#aabbd0', '#7a8a9a', '#bbccdd'],
  ]
  const treeCols = TREE_COLS_BY_GEN[generation % TREE_COLS_BY_GEN.length]

  // Inner cluster (close to mountain base)
  const innerTrees: [number, number, string][] = Array.from({ length: 28 }, (_, i) => {
    const angle = rng() * Math.PI * 2
    const dist  = 4 + rng() * 14
    return [Math.cos(angle) * dist, Math.sin(angle) * dist, treeCols[i % treeCols.length]]
  })

  // Mid-range forest
  const midTrees: [number, number, string][] = Array.from({ length: 30 }, (_, i) => {
    const angle = rng() * Math.PI * 2
    const dist  = 14 + rng() * 20
    return [Math.cos(angle) * dist, Math.sin(angle) * dist, treeCols[i % treeCols.length]]
  })

  // Distant sparse trees
  const farTrees: [number, number, string][] = Array.from({ length: 20 }, (_, i) => {
    const angle = rng() * Math.PI * 2
    const dist  = 34 + rng() * 22
    return [Math.cos(angle) * dist, Math.sin(angle) * dist, treeCols[i % treeCols.length]]
  })

  return { farPeaks, midPeaks, nearPeaks, snowCaps, trees: [...innerTrees, ...midTrees, ...farTrees] }
}

function BackgroundScenery({ generation }: { generation: number }) {
  const { farPeaks, midPeaks, nearPeaks, snowCaps, trees } = makeScenery(generation)
  return (
    <>
      {/* Far peaks — largest, most distant */}
      {farPeaks.map(([x, z, r, h, color], i) => (
        <mesh key={`fp${i}`} position={[x, h / 2, z]}>
          <coneGeometry args={[r, h, 7]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      ))}

      {/* Snow caps on tall far peaks */}
      {snowCaps.map(([x, z, r, h], i) => (
        <mesh key={`sc${i}`} position={[x, farPeaks.filter(([,,,fh]) => fh > 55)[i][3] - h * 0.5, z]}>
          <coneGeometry args={[r, h * 2, 7]} />
          <meshPhongMaterial color={0xeef4ff} flatShading />
        </mesh>
      ))}

      {/* Mid peaks */}
      {midPeaks.map(([x, z, r, h, color], i) => (
        <mesh key={`mp${i}`} position={[x, h / 2, z]}>
          <coneGeometry args={[r, h, 7]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      ))}

      {/* Near hills */}
      {nearPeaks.map(([x, z, r, h, color], i) => (
        <mesh key={`np${i}`} position={[x, h / 2, z]}>
          <coneGeometry args={[r, h, 6]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      ))}

      {/* Trees */}
      {trees.map(([x, z, col], i) => {
        const s = 0.7 + (i * 0.031) % 0.7
        return (
          <group key={`t${i}`} position={[x, 0, z]}>
            <mesh position={[0, 0.2 * s, 0]}>
              <cylinderGeometry args={[0.06 * s, 0.10 * s, 0.45 * s, 5]} />
              <meshPhongMaterial color="#5a3a10" />
            </mesh>
            {([
              [0.72, 0.38],
              [0.50, 0.95],
              [0.28, 1.52],
            ] as [number, number][]).map(([sc, yMult], ti) => (
              <mesh key={ti} position={[0, yMult * s, 0]}>
                <coneGeometry args={[sc * s, 0.75 * s, 6]} />
                <meshPhongMaterial color={col} flatShading />
              </mesh>
            ))}
          </group>
        )
      })}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

const POOL = 5  // circular buffer size

interface MountainWorldProps {
  isClimbing?:      boolean
  onSectionChange?: (index: number) => void
}

export function MountainWorld({
  isClimbing      = true,
  onSectionChange,
}: MountainWorldProps) {

  // ── Refs ───────────────────────────────────────────────────────
  const worldRef  = useRef<THREE.Group>(null)
  const bgRef     = useRef<THREE.Group>(null)
  const avatarRef = useRef<THREE.Group>(null)
  const cloudRef  = useRef<THREE.Group>(null)

  const ref0 = useRef<THREE.Group>(null)
  const ref1 = useRef<THREE.Group>(null)
  const ref2 = useRef<THREE.Group>(null)
  const ref3 = useRef<THREE.Group>(null)
  const ref4 = useRef<THREE.Group>(null)
  const REFS = [ref0, ref1, ref2, ref3, ref4] as const

  // Initial Y positions: -2H, -H, 0, +H, +2H
  const secY = useRef<[number,number,number,number,number]>([
    -SECTION_HEIGHT * 2,
    -SECTION_HEIGHT,
     0,
     SECTION_HEIGHT,
     SECTION_HEIGHT * 2,
  ])
  const secIdx = useRef<[number,number,number,number,number]>([0, 1, 2, 3, 4])
  // cursor always points to the slot with the LOWEST current Y
  const cursor = useRef(0)

  // ── Cloud ──────────────────────────────────────────────────────
  const cloudY         = useRef(CLOUD_ABOVE_OFFSET)
  const spawnCountRef  = useRef(0)
  const lastCloudSpawn = useRef(0)

  // ── Scroll tracking ───────────────────────────────────────────
  const totalScrollY = useRef(0)
  const totalRot     = useRef(0)
  const frameRef     = useRef(0)
  const sectionNum   = useRef(0)

  // ── React state ────────────────────────────────────────────────
  const [secIndices, setSecIndices] = useState<[number,number,number,number,number]>([0,1,2,3,4])
  const [bgGeneration, setBgGeneration] = useState(0)

  // When the cloud fully passes the avatar, swap background scenery
  const handleCloudPassThrough = () => setBgGeneration(g => g + 1)

  // ── Frame loop ─────────────────────────────────────────────────
  useFrame(({ camera }, delta) => {
    frameRef.current++

    if (isClimbing) {
      const dy = CLIMB_SPEED * delta
      totalScrollY.current += dy
      totalRot.current     += ROT_SPEED * delta

      for (let i = 0; i < POOL; i++) secY.current[i] -= dy
      cloudY.current -= dy
    }

    // Apply Y to mountain sections
    for (let i = 0; i < POOL; i++) {
      const g = REFS[i].current
      if (g) g.position.y = secY.current[i]
    }

    // Apply Y to cloud — also inherits worldRef rotation via parent group
    if (cloudRef.current) cloudRef.current.position.y = cloudY.current

    // Background mirrors world rotation + translation
    if (bgRef.current) {
      bgRef.current.position.y = -(totalScrollY.current % 200)
      bgRef.current.rotation.y = ROTATION_DIR * totalRot.current
    }

    // ── Position-based recycling ────────────────────────────────
    const bot = cursor.current
    if (secY.current[bot] < RECYCLE_THRESHOLD) {
      const top = (cursor.current + POOL - 1) % POOL
      secY.current[bot] = secY.current[top] + SECTION_HEIGHT
      secIdx.current[bot] = secIdx.current[bot] + POOL
      cursor.current = (cursor.current + 1) % POOL

      sectionNum.current += 1
      spawnCountRef.current += 1
      onSectionChange?.(sectionNum.current)

      setSecIndices([...secIdx.current] as [number,number,number,number,number])

      // Reset cloud above top every CLOUD_SPAWN_INTERVAL recycles
      if (spawnCountRef.current - lastCloudSpawn.current >= CLOUD_SPAWN_INTERVAL) {
        lastCloudSpawn.current = spawnCountRef.current
        cloudY.current = Math.max(...secY.current) + CLOUD_ABOVE_OFFSET
      }
    }

    // Rotate world group
    if (worldRef.current) {
      worldRef.current.position.set(WORLD_OFFSET_X, WORLD_OFFSET_Y, WORLD_OFFSET_Z)
      worldRef.current.rotation.y = ROTATION_DIR * totalRot.current
    }

    // Leg bob
    if (avatarRef.current && isClimbing) {
      const bob = Math.sin(frameRef.current * 0.20) * 0.055
      ;(avatarRef.current.children[0] as THREE.Mesh).position.y = 0.08 + bob
      ;(avatarRef.current.children[1] as THREE.Mesh).position.y = 0.08 - bob
    }

    // Hard-pin camera
    camera.position.copy(CAM_POS)
    camera.lookAt(CAM_LOOK)
    const cam = camera as THREE.PerspectiveCamera
    if (cam.fov !== CAM_FOV) { cam.fov = CAM_FOV; cam.updateProjectionMatrix() }
  })

  return (
    <>
      <Avatar ref={avatarRef} position={AVATAR_POS} scale={AVATAR_SCALE} />

      {/* Background — lives outside worldRef, mirrors rotation only */}
      <group ref={bgRef}>
        <BackgroundScenery key={bgGeneration} generation={bgGeneration} />
      </group>

      {/* World group — mountain sections + cloud bank all rotate together */}
      <group ref={worldRef}>
        <MountainSection groupRef={ref0} sectionIndex={secIndices[0]} />
        <MountainSection groupRef={ref1} sectionIndex={secIndices[1]} />
        <MountainSection groupRef={ref2} sectionIndex={secIndices[2]} />
        <MountainSection groupRef={ref3} sectionIndex={secIndices[3]} />
        <MountainSection groupRef={ref4} sectionIndex={secIndices[4]} />

        {/* Cloud bank travels down + rotates with worldRef */}
        <CloudBank groupRef={cloudRef} onPassThrough={handleCloudPassThrough} />
      </group>
    </>
  )
}