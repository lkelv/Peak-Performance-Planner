/**
 * MountainHalf.tsx
 *
 * Renders one half-mountain GLB section (Left or Right).
 * The two halves pair together to form a complete mountain cross-section.
 * They are stacked vertically and alternate L/R endlessly.
 *
 * ── Tunables ────────────────────────────────────────────────────
 * All constants live in constants.ts — edit there, not here:
 *   HALF_HEIGHT    — vertical extent of each GLB section
 *   GLB_PATH_LEFT  — public path to Mountain_Left.glb
 *   GLB_PATH_RIGHT — public path to Mountain_Right.glb
 */

import { useRef, memo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { GLB_PATH_LEFT, GLB_PATH_RIGHT } from './constants'

// ─── types (re-exported for MountainWorld) ───────────────────────

export type Side = 'left' | 'right'

export interface HalfSlot {
  /** Unique, ever-increasing id used as React key */
  id:    number
  /** Which GLB to render */
  side:  Side
  /** World-space Y offset of this section's base */
  baseY: number
}

// ─── component ───────────────────────────────────────────────────

interface MountainHalfProps {
  slot: HalfSlot
}

/**
 * A single half-mountain section.
 * Position is driven entirely by `slot.baseY`; the parent `MountainWorld`
 * shifts the whole group downward over time to create the climbing illusion.
 */
export const MountainHalf = memo(function MountainHalf({ slot }: MountainHalfProps) {
  const path = slot.side === 'left' ? GLB_PATH_LEFT : GLB_PATH_RIGHT
  const { scene } = useGLTF(path)

  // Clone the scene so each slot gets its own independent object graph.
  const clonedScene = useRef<THREE.Group | null>(null)
  if (!clonedScene.current) {
    clonedScene.current = scene.clone(true)
  }

  return (
    <primitive
      object={clonedScene.current}
      position={[0, slot.baseY, 0]}
    />
  )
})

// Preload both assets so they are ready before the first render.
useGLTF.preload(GLB_PATH_LEFT)
useGLTF.preload(GLB_PATH_RIGHT)
