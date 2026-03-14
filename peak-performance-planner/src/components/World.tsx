import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  FLOOR_HEIGHT, SCROLL_SPEED, CLOUD_T,
  HELIX_TOTAL_ANGLE, ROTATION_DIR,
  CAM_POS, CAM_LOOK, CAM_FOV,
  AVATAR_POS, AVATAR_SCALE,
  WORLD_OFFSET_X, WORLD_OFFSET_Y, WORLD_OFFSET_Z,
  PATH_START_T,
} from './constants'
import { Floor } from './Floor'
import { Avatar } from './Avatar'

const ROT_PER_Y = HELIX_TOTAL_ANGLE / FLOOR_HEIGHT

interface WorldProps {
  onFloorChange: (floorNumber: number) => void
}

export function World({ onFloorChange }: WorldProps) {
  const worldRef  = useRef<THREE.Group>(null)
  const frameRef  = useRef(0)
  const avatarRef = useRef<THREE.Group>(null)

  // scrolledY stays in [0, FLOOR_HEIGHT) — it resets on each floor transition.
  // This prevents floating-point drift and keeps world.position.y small.
  const scrolledYRef  = useRef(PATH_START_T * FLOOR_HEIGHT)

  // Total accumulated rotation so it stays continuous across resets.
  const totalRotRef   = useRef(PATH_START_T * FLOOR_HEIGHT * ROT_PER_Y)

  // Floor display number shown in HUD (1-based)
  const floorNumberRef = useRef(1)

  // Only ever two floors mounted: slot 0 = current, slot 1 = next.
  // Both always sit at fixed localY: current=0, next=FLOOR_HEIGHT.
  // On transition we just swap their keys to remount geometry.
  const [floorKeys, setFloorKeys] = useState<[number, number]>([0, 1])

  useFrame(({ camera }) => {
    frameRef.current++

    const world = worldRef.current
    if (!world) return

    scrolledYRef.current += SCROLL_SPEED
    totalRotRef.current  += SCROLL_SPEED * ROT_PER_Y

    // ── Floor transition ─────────────────────────────────────────
    if (scrolledYRef.current >= FLOOR_HEIGHT) {
      // Wrap scrolledY back — world.position.y never grows unboundedly
      scrolledYRef.current -= FLOOR_HEIGHT

      floorNumberRef.current += 1
      onFloorChange(floorNumberRef.current)

      // Advance keys: old "next" becomes new "current", spawn fresh "next"
      setFloorKeys(([, next]) => [next, next + 1])
    }

    // ── Apply world transform ────────────────────────────────────
    // world.position.y stays in [-FLOOR_HEIGHT, 0] — always small
    world.position.set(
      WORLD_OFFSET_X,
      -scrolledYRef.current + WORLD_OFFSET_Y,
      WORLD_OFFSET_Z,
    )
    // totalRotRef accumulates continuously so rotation never jumps
    world.rotation.y = ROTATION_DIR * -totalRotRef.current

    // ── Leg bob ──────────────────────────────────────────────────
    if (avatarRef.current) {
      const bob = Math.sin(frameRef.current * 0.20) * 0.055
      ;(avatarRef.current.children[0] as THREE.Mesh).position.y = 0.08 + bob
      ;(avatarRef.current.children[1] as THREE.Mesh).position.y = 0.08 - bob
    }

    // ── Hard-pin camera ──────────────────────────────────────────
    camera.position.copy(CAM_POS)
    camera.lookAt(CAM_LOOK)
    if ((camera as THREE.PerspectiveCamera).fov !== CAM_FOV) {
      ;(camera as THREE.PerspectiveCamera).fov = CAM_FOV
      ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
    }
  })

  return (
    <>
      <Avatar ref={avatarRef} position={AVATAR_POS} scale={AVATAR_SCALE} />

      <group ref={worldRef}>
        {/* Current floor always at localY=0, next always at localY=FLOOR_HEIGHT */}
        <Floor
          key={floorKeys[0]}
          localY={0}
          cloudT={CLOUD_T}
          scrolledYRef={scrolledYRef}
          isCurrentFloor
        />
        <Floor
          key={floorKeys[1]}
          localY={FLOOR_HEIGHT}
          cloudT={CLOUD_T}
          scrolledYRef={scrolledYRef}
          isCurrentFloor={false}
        />
      </group>
    </>
  )
}
