/**
 * MountainWorld.tsx
 *
 * Infinite-scroll mountain system using alternating Left / Right GLB halves.
 *
 * ── How it works ────────────────────────────────────────────────
 *
 *  World layout (Y axis, three slots always live):
 *
 *   ┌──────────────────────┐  ← slot[2]  baseY = travelledY + HALF_HEIGHT
 *   │   NEXT   (spawning)  │
 *   ├──────────────────────┤  ← slot[1]  baseY = travelledY
 *   │   CURRENT            │   avatar visually sits at the midpoint
 *   ├──────────────────────┤  ← slot[0]  baseY = travelledY - HALF_HEIGHT
 *   │   PREVIOUS (leaving) │
 *   └──────────────────────┘
 *
 *  The `worldGroup` Y position is driven by `-travelledY` so the
 *  mountain scrolls downward as the avatar climbs.
 *
 *  Swap trigger: when (travelledY % HALF_HEIGHT) crosses HALF_HEIGHT * 0.5
 *  (the midpoint of the current section), push a new slot on top and
 *  drop the bottom one.
 *
 * ── Side alternation ────────────────────────────────────────────
 *  Slot sides alternate strictly:  L R L R L R …
 *  The first slot is always 'left'. Each new slot spawned on top
 *  flips from the topmost existing slot's side.
 *
 * ── Tunables ────────────────────────────────────────────────────
 *  All knobs live in constants.ts — edit there, not here:
 *    HALF_HEIGHT  — GLB section height in world units
 *    CLIMB_SPEED  — world-units/second the avatar climbs
 *    SWAP_FRAC    — fraction [0–1] at which sections swap (default 0.5)
 *    CLOUD_FRAC   — fraction [0–1] where the cloud band sits
 *
 * ── Props ────────────────────────────────────────────────────────
 *  isClimbing   : boolean — drives scroll when true
 *  onSectionChange : (sectionIndex: number) => void — fires each swap
 */

import { useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  CAM_POS, CAM_LOOK, CAM_FOV,
  AVATAR_POS, AVATAR_SCALE,
  HALF_HEIGHT, CLIMB_SPEED, SWAP_FRAC, CLOUD_FRAC,
} from './constants'
import { Avatar } from './Avatar'
import { CloudBank } from './CloudBank'
import { MountainHalf } from './MountainHalf'
import type { HalfSlot, Side } from './MountainHalf'

// ─── helpers ─────────────────────────────────────────────────────

function oppositeSide(s: Side): Side {
  return s === 'left' ? 'right' : 'left'
}

/** Build the initial 3 slots [bottom, middle, top]. */
function makeInitialSlots(): HalfSlot[] {
  return [
    { id: 0, side: 'left',  baseY: -HALF_HEIGHT },
    { id: 1, side: 'right', baseY: 0            },
    { id: 2, side: 'left',  baseY:  HALF_HEIGHT },
  ]
}

// ─── Component ───────────────────────────────────────────────────

interface MountainWorldProps {
  isClimbing?:      boolean
  onSectionChange?: (index: number) => void
}

export function MountainWorld({
  isClimbing      = true,
  onSectionChange,
}: MountainWorldProps) {
  // ── Refs (updated every frame, never cause re-renders) ──────────
  const worldRef       = useRef<THREE.Group>(null)
  const avatarRef      = useRef<THREE.Group>(null)
  const frameRef       = useRef(0)

  /**
   * travelledY: how many world-units the avatar has climbed in total.
   * The world group is offset by -travelledY so the mountain scrolls down.
   *
   * localY: travelledY % HALF_HEIGHT — position within the current section.
   * When localY crosses HALF_HEIGHT * 0.5 we trigger a slot swap.
   */
  const travelledYRef  = useRef(0)
  const swappedRef     = useRef(false)   // debounce — one swap per crossing
  const sectionRef     = useRef(0)       // section counter for onSectionChange
  const nextIdRef      = useRef(3)       // monotonically increasing slot id

  // scrolledYRef is passed down to CloudBank exactly like the old Floor system.
  // It holds (travelledY % HALF_HEIGHT) — position within the current section.
  const scrolledYRef   = useRef<number>(0)

  // ── Slots (React state — only changes on swap) ──────────────────
  const [slots, setSlots] = useState<HalfSlot[]>(makeInitialSlots)

  // ── Slot swap ───────────────────────────────────────────────────
  const handleSwap = useCallback(() => {
    sectionRef.current += 1
    onSectionChange?.(sectionRef.current)

    setSlots(prev => {
      // The new top slot's side is the opposite of the current top.
      const topSide  = oppositeSide(prev[prev.length - 1].side)
      const topBaseY = prev[prev.length - 1].baseY + HALF_HEIGHT
      const newSlot: HalfSlot = {
        id:    nextIdRef.current++,
        side:  topSide,
        baseY: topBaseY,
      }
      // Drop the bottom slot, add a new top slot.
      return [...prev.slice(1), newSlot]
    })
  }, [onSectionChange])

  // ── Frame loop ───────────────────────────────────────────────────
  useFrame(({ camera }, delta) => {
    frameRef.current++

    // ── Advance travel ───────────────────────────────────────────
    if (isClimbing) {
      travelledYRef.current += CLIMB_SPEED * delta
    }

    const localY = travelledYRef.current % HALF_HEIGHT
    scrolledYRef.current = localY

    // ── Swap trigger at SWAP_FRAC through the current section ────
    const swapThreshold = HALF_HEIGHT * SWAP_FRAC
    if (localY >= swapThreshold && !swappedRef.current) {
      swappedRef.current = true
      handleSwap()
    }
    if (localY < swapThreshold) {
      swappedRef.current = false   // reset for next crossing
    }

    // ── Shift world downward ─────────────────────────────────────
    if (worldRef.current) {
      worldRef.current.position.y = -travelledYRef.current
    }

    // ── Leg bob ──────────────────────────────────────────────────
    if (avatarRef.current && isClimbing) {
      const bob = Math.sin(frameRef.current * 0.20) * 0.055
      ;(avatarRef.current.children[0] as THREE.Mesh).position.y = 0.08 + bob
      ;(avatarRef.current.children[1] as THREE.Mesh).position.y = 0.08 - bob
    }

    // ── Hard-pin camera ──────────────────────────────────────────
    camera.position.copy(CAM_POS)
    camera.lookAt(CAM_LOOK)
    const cam = camera as THREE.PerspectiveCamera
    if (cam.fov !== CAM_FOV) {
      cam.fov = CAM_FOV
      cam.updateProjectionMatrix()
    }
  })

  // ── Cloud position: top 80% of the current (middle) slot ────────
  // The middle slot is always prev[1] — its baseY in world-space is
  // approximately travelledY (before the next swap).  But since we
  // offset the worldGroup by -travelledY, the cloud local position
  // within the group is simply:  baseY_of_middle_slot + CLOUD_FRAC * HALF_HEIGHT.
  //
  // However, the CloudBank was designed to work with scrolledYRef in
  // [0, FLOOR_HEIGHT) space.  We pass scrolledYRef and a cloudT so it
  // can compute proximity the same way it always did.

  return (
    <>
      {/* Avatar is fixed in screen space — world scrolls past it */}
      <Avatar ref={avatarRef} position={AVATAR_POS} scale={AVATAR_SCALE} />

      {/* The world group scrolls downward as travelledY increases */}
      <group ref={worldRef}>
        {slots.map((slot, i) => (
          <MountainHalf key={slot.id} slot={slot} />
        ))}

        {/* Cloud bank — sits at 80% up the current section.
            We anchor it to travelledY so it stays visually consistent.
            The localY of the cloud within the section is CLOUD_FRAC * HALF_HEIGHT.
            Because worldRef.position.y = -travelledY, and slots[1].baseY
            is always the "current" section's base in world group space
            (approximately travelledY - localY), the cloud's group-space Y is:
              slots[1].baseY + CLOUD_FRAC * HALF_HEIGHT
            We use a separate fixed CloudBank keyed to the current section. */}
        {slots.length >= 2 && (
          <CloudBank
            key={`cloud-${slots[1].id}`}
            localY={slots[1].baseY + CLOUD_FRAC * HALF_HEIGHT}
            scrolledYRef={scrolledYRef}
            isCurrentFloor={true}
            cloudT={CLOUD_FRAC}
          />
        )}
      </group>
    </>
  )
}
