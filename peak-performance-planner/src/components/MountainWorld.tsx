/**
 * MountainWorld.tsx
 *
 * ── Mountain sections ────────────────────────────────────────────
 *  3 GLB slots in a circular buffer. Each spawns at the top when
 *  the bottom slot falls off-screen, keeping exactly 3 connected
 *  halves visible at all times.
 *
 * ── Background scrolling ────────────────────────────────────────
 *  bgRef lives OUTSIDE worldRef. Each frame we copy worldRef's
 *  rotation AND apply the same Y translation so trees/mountains
 *  scroll at identical speed. bgGeneration key remounts scenery
 *  after each cloud passage.
 *
 * ── Cloud bank ──────────────────────────────────────────────────
 *  cloudRef is a section-style slot inside worldRef. Its Y is
 *  driven exactly like a mountain section — it travels DOWN at
 *  CLIMB_SPEED. It spawns (resets to top) every CLOUD_SPAWN_INTERVAL
 *  mountain spawns. When the avatar passes through it, background
 *  scenery is regenerated.
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
  SPAWN_INTERVAL,
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

// Deterministic-ish random from seed
function seededRand(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

function makeScenery(generation: number) {
  const rng = seededRand(generation * 7919 + 1)

  const PEAK_PALETTES = [
    [0x2a3f1e, 0x253818, 0x2d4220],  // deep green (low)
    [0x3a5a2a, 0x4a6a38, 0x508040],  // brighter mid-green
    [0x6a7a5a, 0x7a8a68, 0x8a9a78],  // high rocky green-grey
    [0x8a8a9a, 0x9a9aaa, 0xaaaacc],  // grey rocky
    [0xaabbcc, 0xbbccdd, 0xccdded],  // snowy pale blue
  ]
  const palette = PEAK_PALETTES[generation % PEAK_PALETTES.length]

  const peaks: [number, number, number, number, number][] = Array.from({ length: 14 }, () => {
    const angle = rng() * Math.PI * 2
    const dist  = 40 + rng() * 55
    const r     = 10 + rng() * 14
    const h     = 22 + rng() * 32
    const col   = palette[Math.floor(rng() * palette.length)]
    return [Math.cos(angle) * dist, Math.sin(angle) * dist, r, h, col]
  })

  const TREE_COLS = ['#2a5a1a', '#2f6a20', '#336620', '#3a7226', '#1e4a12']
  const trees: [number, number, string][] = Array.from({ length: 22 }, (_, i) => {
    const angle = rng() * Math.PI * 2
    const dist  = 5 + rng() * 18
    return [Math.cos(angle) * dist, Math.sin(angle) * dist, TREE_COLS[i % TREE_COLS.length]]
  })

  return { peaks, trees }
}

interface SceneryProps { generation: number }

function BackgroundScenery({ generation }: SceneryProps) {
  const { peaks, trees } = makeScenery(generation)
  return (
    <>
      {peaks.map(([x, z, r, h, color], i) => (
        <mesh key={i} position={[x, h / 2, z]}>
          <coneGeometry args={[r, h, 7]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      ))}
      {trees.map(([x, z, col], i) => {
        const s = 0.85 + (i * 0.037)
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.2 * s, 0]}>
              <cylinderGeometry args={[0.06 * s, 0.09 * s, 0.4 * s, 5]} />
              <meshPhongMaterial color="#5a3a10" />
            </mesh>
            {([
              [0.70, 0.38],
              [0.48, 0.93],
              [0.26, 1.48],
            ] as [number, number][]).map(([sc, yMult], ti) => (
              <mesh key={ti} position={[0, yMult * s, 0]}>
                <coneGeometry args={[sc * s, 0.7 * s, 6]} />
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

interface MountainWorldProps {
  isClimbing?:      boolean
  onSectionChange?: (index: number) => void
}

export function MountainWorld({
  isClimbing      = true,
  onSectionChange,
}: MountainWorldProps) {

  // ── Mountain section refs ──────────────────────────────────────
  const worldRef  = useRef<THREE.Group>(null)
  const bgRef     = useRef<THREE.Group>(null)
  const avatarRef = useRef<THREE.Group>(null)
  const cloudRef  = useRef<THREE.Group>(null)

  const ref0 = useRef<THREE.Group>(null)
  const ref1 = useRef<THREE.Group>(null)
  const ref2 = useRef<THREE.Group>(null)
  const REFS = [ref0, ref1, ref2] as const

  // Section Y positions: bottom = -H, middle = 0, top = +H
  const secY   = useRef<[number, number, number]>([-SECTION_HEIGHT, 0, SECTION_HEIGHT])
  const secIdx = useRef<[number, number, number]>([0, 1, 2])
  const cursor = useRef(0)

  // ── Cloud section ──────────────────────────────────────────────
  // Cloud starts well above the view and scrolls down like a section.
  // It resets to a new top position every CLOUD_SPAWN_INTERVAL spawns.
  const cloudY         = useRef(CLOUD_ABOVE_OFFSET)  // local Y inside worldRef
  const spawnCountRef  = useRef(0)
  const lastCloudSpawn = useRef(0)   // spawnCount at last cloud reset

  // ── Scroll tracking ───────────────────────────────────────────
  const totalScrollY = useRef(0)
  const lastSpawnY   = useRef(0)
  const totalRot     = useRef(0)
  const frameRef     = useRef(0)
  const sectionNum   = useRef(0)

  // ── React state ────────────────────────────────────────────────
  const [secIndices, setSecIndices]   = useState<[number, number, number]>([0, 1, 2])
  const [bgGeneration, setBgGeneration] = useState(0)

  // ── Pass-through callback ──────────────────────────────────────
  const handleCloudPassThrough = () => {
    setBgGeneration(g => g + 1)
  }

  // ── Frame loop ─────────────────────────────────────────────────
  useFrame(({ camera }, delta) => {
    frameRef.current++

    if (isClimbing) {
      const dy = CLIMB_SPEED * delta
      totalScrollY.current += dy
      totalRot.current     += ROT_SPEED * delta

      secY.current[0] -= dy
      secY.current[1] -= dy
      secY.current[2] -= dy

      // Cloud scrolls down at same speed as sections
      cloudY.current -= dy
    }

    // Apply Y to mountain sections
    for (let i = 0; i < 3; i++) {
      const g = REFS[i].current
      if (g) g.position.y = secY.current[i]
    }

    // Apply Y to cloud (inside worldRef so it inherits rotation)
    if (cloudRef.current) {
      cloudRef.current.position.y = cloudY.current
    }

    // ── Background mirrors world rotation + translation ─────────
    if (bgRef.current) {
      bgRef.current.position.y  = -(totalScrollY.current % 200)
      bgRef.current.rotation.y  = ROTATION_DIR * totalRot.current
    }

    // ── Spawn trigger ───────────────────────────────────────────
    if (totalScrollY.current - lastSpawnY.current >= SPAWN_INTERVAL) {
      lastSpawnY.current += SPAWN_INTERVAL

      const bot = cursor.current
      const top = (cursor.current + 2) % 3
      secY.current[bot] = secY.current[top] + SECTION_HEIGHT
      secIdx.current[bot] = secIdx.current[bot] + 3
      cursor.current = (cursor.current + 1) % 3

      sectionNum.current += 1
      spawnCountRef.current += 1
      onSectionChange?.(sectionNum.current)

      setSecIndices([secIdx.current[0], secIdx.current[1], secIdx.current[2]])

      // Reset cloud to above the top section every CLOUD_SPAWN_INTERVAL spawns
      if (spawnCountRef.current - lastCloudSpawn.current >= CLOUD_SPAWN_INTERVAL) {
        lastCloudSpawn.current = spawnCountRef.current
        // Place cloud CLOUD_ABOVE_OFFSET units above the highest section Y
        const topY = Math.max(secY.current[0], secY.current[1], secY.current[2])
        cloudY.current = topY + CLOUD_ABOVE_OFFSET
      }
    }

    // ── Rotate world group ──────────────────────────────────────
    if (worldRef.current) {
      worldRef.current.position.set(WORLD_OFFSET_X, WORLD_OFFSET_Y, WORLD_OFFSET_Z)
      worldRef.current.rotation.y = ROTATION_DIR * totalRot.current
    }

    // ── Leg bob ─────────────────────────────────────────────────
    if (avatarRef.current && isClimbing) {
      const bob = Math.sin(frameRef.current * 0.20) * 0.055
      ;(avatarRef.current.children[0] as THREE.Mesh).position.y = 0.08 + bob
      ;(avatarRef.current.children[1] as THREE.Mesh).position.y = 0.08 - bob
    }

    // ── Hard-pin camera ─────────────────────────────────────────
    camera.position.copy(CAM_POS)
    camera.lookAt(CAM_LOOK)
    const cam = camera as THREE.PerspectiveCamera
    if (cam.fov !== CAM_FOV) {
      cam.fov = CAM_FOV
      cam.updateProjectionMatrix()
    }
  })

  return (
    <>
      {/* Avatar — fixed in screen space */}
      <Avatar ref={avatarRef} position={AVATAR_POS} scale={AVATAR_SCALE} />

      {/* Background — sibling of worldRef, manually synced */}
      <group ref={bgRef}>
        <BackgroundScenery key={bgGeneration} generation={bgGeneration} />
      </group>

      {/* World group — rotates only */}
      <group ref={worldRef}>

        {/* Mountain sections */}
        <MountainSection groupRef={ref0} sectionIndex={secIndices[0]} />
        <MountainSection groupRef={ref1} sectionIndex={secIndices[1]} />
        <MountainSection groupRef={ref2} sectionIndex={secIndices[2]} />

        {/* Cloud bank — travels down like a section, swaps background on passage */}
        <CloudBank
          groupRef={cloudRef}
          onPassThrough={handleCloudPassThrough}
        />

      </group>
    </>
  )
}
