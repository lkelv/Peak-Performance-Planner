/**
 * MountainWorld.tsx
 *
 * ── Architecture ─────────────────────────────────────────────────
 *
 *  THREE physical group refs (ref0, ref1, ref2) are fixed in the JSX.
 *  They never remount. Their Y position is written directly every frame.
 *
 *  A circular "cursor" tracks which ref is bottom/middle/top:
 *    cursor=0  → refs are [bottom=0, middle=1, top=2]
 *    cursor=1  → refs are [bottom=1, middle=2, top=0]
 *    cursor=2  → refs are [bottom=2, middle=0, top=1]
 *
 *  Each ref has a stable "section index" that only increments when
 *  that slot gets recycled to the top. The index drives the rotation
 *  flip (even index = base rotation, odd = base + π).
 *
 *  Scroll: every frame, all three ref Y values decrease by CLIMB_SPEED*delta.
 *
 *  Swap: when the MIDDLE ref's Y <= -SECTION_HEIGHT/2 (avatar at midpoint):
 *    1. Teleport the BOTTOM ref to (TOP ref Y + SECTION_HEIGHT)
 *    2. Advance cursor by 1  →  old bottom becomes new top
 *    3. Increment that slot's section index (new section number)
 *
 *  Background scenery lives inside the world group at fixed Y=0.
 *  The world group only rotates — never translates.
 *  Sections scroll past the background by their own Y movement.
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
  CLIMB_SPEED, ROT_SPEED,
  CLOUD_T, CLOUD_FRAC,
} from './constants'
import { Avatar } from './Avatar'
import { CloudBank } from './CloudBank'
import { MountainSection } from './MountainHalf'

// ─────────────────────────────────────────────────────────────────
// Background scenery — trees + mountain cones, fixed in world group
// ─────────────────────────────────────────────────────────────────

const BG_PEAKS: [number, number, number, number, number][] = [
  [-55, -45, 22, 46, 0x2a3f1e], [-42, -58, 16, 34, 0x253818],
  [ 50, -50, 19, 40, 0x2d4220], [ 40, -62, 14, 30, 0x263a1a],
  [-28, -68, 17, 36, 0x22361a], [ 28, -60, 15, 34, 0x2a3e1e],
  [-70, -38, 12, 28, 0x1e3016], [ 65, -42, 11, 26, 0x203214],
  [ 12, -78, 20, 44, 0x2e4422], [-12, -72, 16, 36, 0x243a1c],
  [  0, -88, 22, 48, 0x304624], [-60, -72, 18, 40, 0x263c1c],
  [ 58, -68, 17, 38, 0x283e1e],
]

const TREE_XZ: [number, number][] = [
  [-7,3],[-9,0],[-6,-3],[-10,-6],[-7,-10],[-4,-13],
  [7,2],[9,-1],[7,-4],[10,-7],[6,-11],[4,-14],
  [-2,-16],[2,-17],[0,-19],[-12,1],[12,0],
  [-11,-9],[11,-10],[0,-21],[-14,-3],[14,-4],
]

function BackgroundScenery() {
  return (
    <>
      {BG_PEAKS.map(([x, z, r, h, color], i) => (
        <mesh key={i} position={[x, h / 2, z]}>
          <coneGeometry args={[r, h, 7]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      ))}
      {TREE_XZ.map(([x, z], i) => {
        const s = 0.85 + ((i * 137) % 100) / 182
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.2 * s, 0]}>
              <cylinderGeometry args={[0.06 * s, 0.09 * s, 0.4 * s, 5]} />
              <meshPhongMaterial color="#5a3a10" />
            </mesh>
            {([
              [0.70, 0.38, '#2a5a1a'],
              [0.48, 0.93, '#336620'],
              [0.26, 1.48, '#3a7226'],
            ] as [number, number, string][]).map(([sc, yMult, col], ti) => (
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

  // ── Fixed group refs — never remount ──────────────────────────
  const worldRef  = useRef<THREE.Group>(null)
  const avatarRef = useRef<THREE.Group>(null)
  const ref0 = useRef<THREE.Group>(null)
  const ref1 = useRef<THREE.Group>(null)
  const ref2 = useRef<THREE.Group>(null)
  // Stable array — index never changes
  const REFS = [ref0, ref1, ref2] as const

  // ── Per-slot mutable state (refs, not React state) ────────────
  // y[i]   : current world-Y of the group at REFS[i]
  // sidx[i]: section index for REFS[i] (drives rotation flip)
  const y    = useRef<[number, number, number]>([-SECTION_HEIGHT, 0, SECTION_HEIGHT])
  const sidx = useRef<[number, number, number]>([0, 1, 2])

  // cursor: which physical ref is currently the BOTTOM slot
  // bottom = cursor, middle = (cursor+1)%3, top = (cursor+2)%3
  const cursor = useRef(0)

  // ── Animation state ───────────────────────────────────────────
  const totalRot    = useRef(0)
  const frameRef    = useRef(0)
  const swapLock    = useRef(false)   // one swap per crossing
  const sectionNum  = useRef(0)       // for onSectionChange HUD

  // Position within middle section [0, SECTION_HEIGHT) for CloudBank
  const scrolledYRef = useRef(0)

  // ── React state — only the section indices (for rotation flip) ─
  // We re-render only when a swap happens to update the rotation prop.
  const [sectionIndices, setSectionIndices] = useState<[number, number, number]>([0, 1, 2])

  // ── Frame loop ────────────────────────────────────────────────
  useFrame(({ camera }, delta) => {
    frameRef.current++

    // Scroll all three sections downward
    if (isClimbing) {
      const dy = CLIMB_SPEED * delta
      y.current[0] -= dy
      y.current[1] -= dy
      y.current[2] -= dy
      totalRot.current += ROT_SPEED * delta
    }

    // Apply Y to each ref directly
    for (let i = 0; i < 3; i++) {
      const g = REFS[i].current
      if (g) g.position.y = y.current[i]
    }

    // Which ref is the middle (current) section?
    const mid = (cursor.current + 1) % 3
    const top = (cursor.current + 2) % 3
    const bot = cursor.current

    // CloudBank: how far below 0 the middle section has scrolled
    scrolledYRef.current = Math.max(0, Math.min(SECTION_HEIGHT, -y.current[mid]))

    // ── Swap: middle section has passed its halfway point ────────
    if (y.current[mid] <= -(SECTION_HEIGHT * 0.5) && !swapLock.current) {
      swapLock.current = true

      // Teleport BOTTOM ref to just above TOP ref
      y.current[bot] = y.current[top] + SECTION_HEIGHT

      // Advance cursor: old bottom becomes new top
      cursor.current = (cursor.current + 1) % 3

      // Increment the section index for the recycled (now top) slot
      const newIdx = sidx.current[bot] + 3
      sidx.current[bot] = newIdx

      // Notify HUD
      sectionNum.current += 1
      onSectionChange?.(sectionNum.current)

      // Trigger re-render so rotation prop updates on the recycled slot
      setSectionIndices([sidx.current[0], sidx.current[1], sidx.current[2]])
    }

    // Unlock swap once middle has scrolled back past -SECTION_HEIGHT/2
    // (i.e. after the cursor advanced, the new middle starts near 0)
    if (y.current[(cursor.current + 1) % 3] > -(SECTION_HEIGHT * 0.5)) {
      swapLock.current = false
    }

    // Rotate + position world group
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
    if (cam.fov !== CAM_FOV) {
      cam.fov = CAM_FOV
      cam.updateProjectionMatrix()
    }
  })

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* Avatar — outside world group, stays fixed in screen space */}
      <Avatar ref={avatarRef} position={AVATAR_POS} scale={AVATAR_SCALE} />

      {/* World group — rotates only, never translates */}
      <group ref={worldRef}>

        {/* 3 fixed slots — each bound to its own stable ref */}
        <MountainSection groupRef={ref0} sectionIndex={sectionIndices[0]} />
        <MountainSection groupRef={ref1} sectionIndex={sectionIndices[1]} />
        <MountainSection groupRef={ref2} sectionIndex={sectionIndices[2]} />

        {/* Background — fixed in world group, rotates with it */}
        <BackgroundScenery />

        {/* Cloud band */}
        <CloudBank
          localY={CLOUD_FRAC * SECTION_HEIGHT}
          scrolledYRef={scrolledYRef}
          isCurrentFloor={true}
          cloudT={CLOUD_T}
        />

      </group>
    </>
  )
}
