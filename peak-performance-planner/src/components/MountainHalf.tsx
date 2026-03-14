/**
 * MountainHalf.tsx
 *
 * Renders one GLB instance inside a group whose ref is owned by MountainWorld.
 * MountainWorld moves the group's Y directly every frame — this component
 * never needs to re-render for position changes.
 *
 * sectionIndex : ever-increasing integer.
 *   Even  → SECTION_ROTATION_Y
 *   Odd   → SECTION_ROTATION_Y + Math.PI  (flipped 180°)
 * This alternation makes consecutive sections face opposite directions,
 * connecting the path into a continuous spiral.
 */

import { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import {
  GLB_PATH,
  SECTION_SCALE,
  SECTION_OFFSET_X,
  SECTION_OFFSET_Z,
  SECTION_ROTATION_Y,
} from './constants'

interface MountainSectionProps {
  groupRef:     React.RefObject<THREE.Group>
  sectionIndex: number
}

export function MountainSection({ groupRef, sectionIndex }: MountainSectionProps) {
  const { scene } = useGLTF(GLB_PATH)

  const cloned = useRef<THREE.Group | null>(null)
  if (!cloned.current) {
    cloned.current = scene.clone(true)
  }

  const isOdd = sectionIndex % 2 === 1
  const rotY  = SECTION_ROTATION_Y + (isOdd ? Math.PI : 0)
  // Mirror X offset for odd sections: the flat face must meet the
  // world-space seam after a 180° Y-flip, so negate the X shift.
  const offX  = isOdd ? -SECTION_OFFSET_X : SECTION_OFFSET_X

  return (
    <group ref={groupRef}>
      <primitive
        object={cloned.current}
        position={[offX, 0, SECTION_OFFSET_Z]}
        rotation={[0, rotY, 0]}
        scale={SECTION_SCALE}
      />
    </group>
  )
}

useGLTF.preload(GLB_PATH)
