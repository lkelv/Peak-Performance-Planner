/**
 * MountainWorld.tsx
 *
 * ── Mountain sections ────────────────────────────────────────────
 *  5 GLB slots in a circular buffer. Position-based recycling:
 *  the bottom slot teleports to the top once it drops below
 *  RECYCLE_THRESHOLD.
 *
 * ── Background scrolling ─────────────────────────────────────────
 *  Mountains and trees live in SEPARATE groups so they can be
 *  positioned independently.
 *
 * ── Cloud bank + mountain respawn ────────────────────────────────
 *  When the cloud passes the avatar, mountainSpawnScrollY is
 *  snapshotted to totalScrollY at that moment. The mountains group
 *  is then positioned at (mountainSpawnScrollY - totalScrollY),
 *  which places them at world-Y ≈ 0 (cloud level) at the instant
 *  they spawn, and they scroll down naturally from there — no
 *  modulo wrap, no teleport. Trees are permanently modulo-scrolled
 *  and never remounted.
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
// Seeded RNG
// ─────────────────────────────────────────────────────────────────

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─────────────────────────────────────────────────────────────────
// Background mountains — remounted on every cloud pass-through,
// spawning at cloud level and scrolling down from there
// ─────────────────────────────────────────────────────────────────

function makeMountains(generation: number) {
  const rng = seededRand(generation * 7919 + 1)

  const PEAK_PALETTES = [
    [0x2a3f1e, 0x253818, 0x2d4220, 0x1e3012, 0x344a22],
    [0x3a5a2a, 0x4a6a38, 0x508040, 0x2e4a20, 0x5a7048],
    [0x6a7a5a, 0x7a8a68, 0x8a9a78, 0x5a6a4a, 0x909e80],
    [0x8a8a9a, 0x9a9aaa, 0xaaaacc, 0x7a7a8a, 0xb0b0cc],
    [0xaabbcc, 0xbbccdd, 0xccdded, 0x99aabb, 0xddeeff],
  ]
  const palette = PEAK_PALETTES[generation % PEAK_PALETTES.length]

  const farPeaks: [number, number, number, number, number][] = Array.from({ length: 20 }, () => {
    const angle = rng() * Math.PI * 2
    const dist  = 70 + rng() * 60
    const r     = 14 + rng() * 20
    const h     = 35 + rng() * 50
    const col   = palette[Math.floor(rng() * palette.length)]
    return [Math.cos(angle) * dist, Math.sin(angle) * dist, r, h, col]
  })

  const midPeaks: [number, number, number, number, number][] = Array.from({ length: 20 }, () => {
    const angle = rng() * Math.PI * 2
    const dist  = 35 + rng() * 35
    const r     = 9 + rng() * 14
    const h     = 20 + rng() * 35
    const col   = palette[Math.floor(rng() * palette.length)]
    return [Math.cos(angle) * dist, Math.sin(angle) * dist, r, h, col]
  })

  const nearPeaks: [number, number, number, number, number][] = Array.from({ length: 14 }, () => {
    const angle = rng() * Math.PI * 2
    const dist  = 25 + rng() * 18
    const r     = 5 + rng() * 8
    const h     = 10 + rng() * 18
    const col   = palette[Math.floor(rng() * palette.length)]
    return [Math.cos(angle) * dist, Math.sin(angle) * dist, r, h, col]
  })

  const snowCaps: [number, number, number, number][] = farPeaks
    .filter(([,,, h]) => h > 55)
    .map(([x, z, r, h]) => [x, z, r * 0.3, h * 0.18])

  return { farPeaks, midPeaks, nearPeaks, snowCaps }
}

function BackgroundMountains({ generation }: { generation: number }) {
  const { farPeaks, midPeaks, nearPeaks, snowCaps } = makeMountains(generation)
  const tallFar = farPeaks.filter(([,,, h]) => h > 55)
  return (
    <>
      {farPeaks.map(([x, z, r, h, color], i) => (
        <mesh key={`fp${i}`} position={[x, h / 2, z]}>
          <coneGeometry args={[r, h, 7]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      ))}

      {snowCaps.map(([x, z, r, h], i) => (
        <mesh key={`sc${i}`} position={[x, tallFar[i][3] - h * 0.5, z]}>
          <coneGeometry args={[r, h * 2, 7]} />
          <meshPhongMaterial color={0xeef4ff} flatShading />
        </mesh>
      ))}

      {midPeaks.map(([x, z, r, h, color], i) => (
        <mesh key={`mp${i}`} position={[x, h / 2, z]}>
          <coneGeometry args={[r, h, 7]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      ))}

      {nearPeaks.map(([x, z, r, h, color], i) => (
        <mesh key={`np${i}`} position={[x, h / 2, z]}>
          <coneGeometry args={[r, h, 6]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      ))}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Background trees — permanent, never remounted
// ─────────────────────────────────────────────────────────────────

const STATIC_TREE_XZ: [number, number][] = [
  [-7,3],[-9,0],[-6,-3],[-10,-6],[-7,-10],[-4,-13],
  [7,2],[9,-1],[7,-4],[10,-7],[6,-11],[4,-14],
  [-2,-16],[2,-17],[0,-19],[-12,1],[12,0],
  [-11,-9],[11,-10],[0,-21],[-14,-3],[14,-4],
  [-5,-20],[5,-21],[-8,-14],[8,-15],
  [-16,4],[16,3],[-13,-13],[13,-14],
  [-3,5],[4,6],[-18,-5],[18,-6],
]

function BackgroundTrees() {
  return (
    <>
      {STATIC_TREE_XZ.map(([x, z], i) => {
        const s = 0.7 + (i * 0.031) % 0.7
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.2 * s, 0]}>
              <cylinderGeometry args={[0.06 * s, 0.10 * s, 0.45 * s, 5]} />
              <meshPhongMaterial color="#5a3a10" />
            </mesh>
            {([
              [0.72, 0.38, '#2a5a1a'],
              [0.50, 0.95, '#336620'],
              [0.28, 1.52, '#3a7226'],
            ] as [number, number, string][]).map(([sc, yMult, col], ti) => (
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
// Main component
// ─────────────────────────────────────────────────────────────────

const POOL = 5

interface MountainWorldProps {
  isClimbing?: boolean
}

export function MountainWorld({ isClimbing = true }: MountainWorldProps) {

  const worldRef       = useRef<THREE.Group>(null)
  const bgMountainsRef = useRef<THREE.Group>(null)  // remounted on cloud pass
  const bgTreesRef     = useRef<THREE.Group>(null)  // permanent
  const avatarRef      = useRef<THREE.Group>(null)
  const cloudRef       = useRef<THREE.Group>(null)

  const ref0 = useRef<THREE.Group>(null)
  const ref1 = useRef<THREE.Group>(null)
  const ref2 = useRef<THREE.Group>(null)
  const ref3 = useRef<THREE.Group>(null)
  const ref4 = useRef<THREE.Group>(null)
  const REFS = [ref0, ref1, ref2, ref3, ref4] as const

  const secY = useRef<[number, number, number, number, number]>([
    -SECTION_HEIGHT * 2,
    -SECTION_HEIGHT,
     0,
     SECTION_HEIGHT,
     SECTION_HEIGHT * 2,
  ])
  const secIdx  = useRef<[number, number, number, number, number]>([0, 1, 2, 3, 4])
  const cursor  = useRef(0)

  const cloudY         = useRef(CLOUD_ABOVE_OFFSET)
  const spawnCountRef  = useRef(0)
  const lastCloudSpawn = useRef(0)

  const totalScrollY = useRef(0)
  const totalRot     = useRef(0)
  const frameRef     = useRef(0)

  // Snapshot of totalScrollY at the moment each mountain set spawned.
  // Mountains are positioned at (mountainSpawnScrollY - totalScrollY),
  // placing them at world-Y ≈ 0 (cloud level) on spawn, then scrolling
  // down naturally — no modulo, no teleport.
  const mountainSpawnScrollY = useRef(0)

  const [secIndices, setSecIndices]                     = useState<[number, number, number, number, number]>([0, 1, 2, 3, 4])
  const [bgMountainGeneration, setBgMountainGeneration] = useState(0)

  const handleCloudPassThrough = () => {
    // Lock in the current scroll position as the spawn baseline so the
    // new mountains appear right at cloud level the frame they mount.
    mountainSpawnScrollY.current = totalScrollY.current
    setBgMountainGeneration(g => g + 1)
  }

  useFrame(({ camera }, delta) => {
    frameRef.current++

    if (isClimbing) {
      const dy = CLIMB_SPEED * delta
      totalScrollY.current += dy
      totalRot.current     += ROT_SPEED * delta

      for (let i = 0; i < POOL; i++) secY.current[i] -= dy
      cloudY.current -= dy
    }

    for (let i = 0; i < POOL; i++) {
      const g = REFS[i].current
      if (g) g.position.y = secY.current[i]
    }

    if (cloudRef.current) cloudRef.current.position.y = cloudY.current

    const sharedRotY = ROTATION_DIR * totalRot.current

    // Mountains: anchored to spawn baseline, scroll down from cloud level.
    if (bgMountainsRef.current) {
      bgMountainsRef.current.position.y = mountainSpawnScrollY.current - totalScrollY.current
      bgMountainsRef.current.rotation.y = sharedRotY
    }

    // Trees: simple modulo scroll, permanently near the base.
    if (bgTreesRef.current) {
      bgTreesRef.current.position.y = -(totalScrollY.current % 200)
      bgTreesRef.current.rotation.y = sharedRotY
    }

    // Position-based section recycling
    const bot = cursor.current
    if (secY.current[bot] < RECYCLE_THRESHOLD) {
      const top = (cursor.current + POOL - 1) % POOL
      secY.current[bot]   = secY.current[top] + SECTION_HEIGHT
      secIdx.current[bot] = secIdx.current[bot] + POOL
      cursor.current      = (cursor.current + 1) % POOL

      spawnCountRef.current += 1
      setSecIndices([...secIdx.current] as [number, number, number, number, number])

      if (spawnCountRef.current - lastCloudSpawn.current >= CLOUD_SPAWN_INTERVAL) {
        lastCloudSpawn.current = spawnCountRef.current
        cloudY.current = Math.max(...secY.current) + CLOUD_ABOVE_OFFSET
      }
    }

    if (worldRef.current) {
      worldRef.current.position.set(WORLD_OFFSET_X, WORLD_OFFSET_Y, WORLD_OFFSET_Z)
      worldRef.current.rotation.y = sharedRotY
    }

    // Leg bob
    if (avatarRef.current && isClimbing) {
      const bob = Math.sin(frameRef.current * 0.20) * 0.055
      ;(avatarRef.current.children[0] as THREE.Mesh).position.y = 0.08 + bob
      ;(avatarRef.current.children[1] as THREE.Mesh).position.y = 0.08 - bob
    }

    camera.position.copy(CAM_POS)
    camera.lookAt(CAM_LOOK)
    const cam = camera as THREE.PerspectiveCamera
    if (cam.fov !== CAM_FOV) { cam.fov = CAM_FOV; cam.updateProjectionMatrix() }
  })

  return (
    <>
      <Avatar ref={avatarRef} position={AVATAR_POS} scale={AVATAR_SCALE} />

      {/* Mountains — separate group, repositioned to cloud Y on each remount */}
      <group ref={bgMountainsRef}>
        <BackgroundMountains key={bgMountainGeneration} generation={bgMountainGeneration} />
      </group>

      {/* Trees — separate group, permanently scrolling, never remounted */}
      <group ref={bgTreesRef}>
        <BackgroundTrees />
      </group>

      {/* World group — GLB sections + cloud bank rotate together */}
      <group ref={worldRef}>
        <MountainSection groupRef={ref0} sectionIndex={secIndices[0]} />
        <MountainSection groupRef={ref1} sectionIndex={secIndices[1]} />
        <MountainSection groupRef={ref2} sectionIndex={secIndices[2]} />
        <MountainSection groupRef={ref3} sectionIndex={secIndices[3]} />
        <MountainSection groupRef={ref4} sectionIndex={secIndices[4]} />

        <CloudBank groupRef={cloudRef} onPassThrough={handleCloudPassThrough} />
      </group>
    </>
  )
}