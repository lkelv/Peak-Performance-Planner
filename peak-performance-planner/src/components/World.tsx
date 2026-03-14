import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  FLOOR_HEIGHT, SCROLL_SPEED, CLOUD_T,
  HELIX_TOTAL_ANGLE, ROTATION_DIR,
  CAM_POS, CAM_LOOK, CAM_FOV,
  AVATAR_POS, AVATAR_SCALE,
  WORLD_OFFSET_X, WORLD_OFFSET_Y, WORLD_OFFSET_Z,
  PATH_START_T, FLOOR_SWAP_DELAY_MS,
} from './constants'
import { Floor } from './Floor'
import { Avatar } from './Avatar'

const ROT_PER_Y = HELIX_TOTAL_ANGLE / FLOOR_HEIGHT

interface WorldProps {
  onFloorChange: (floorNumber: number) => void
}

// Each slot has a stable numeric key (used as React key) and a localY
interface FloorSlot { key: number; localY: number; isCurrent: boolean }

export function World({ onFloorChange }: WorldProps) {
  const worldRef       = useRef<THREE.Group>(null)
  const frameRef       = useRef(0)
  const avatarRef      = useRef<THREE.Group>(null)
  const scrolledYRef   = useRef(PATH_START_T * FLOOR_HEIGHT)
  const totalRotRef    = useRef(PATH_START_T * FLOOR_HEIGHT * ROT_PER_Y)
  const floorNumberRef = useRef(1)
  const nextKeyRef     = useRef(2) // monotonically increasing key counter

  // slots: normally 2 entries [current, next]
  // briefly 3 entries [prev, current, next] during the delay window
  const [slots, setSlots] = useState<FloorSlot[]>([
    { key: 0, localY: 0,            isCurrent: true  },
    { key: 1, localY: FLOOR_HEIGHT, isCurrent: false },
  ])

  useFrame(({ camera }) => {
    frameRef.current++

    const world = worldRef.current
    if (!world) return

    scrolledYRef.current += SCROLL_SPEED
    totalRotRef.current  += SCROLL_SPEED * ROT_PER_Y

    // ── Floor transition ─────────────────────────────────────────
    if (scrolledYRef.current >= FLOOR_HEIGHT) {
      scrolledYRef.current -= FLOOR_HEIGHT
      floorNumberRef.current += 1
      onFloorChange(floorNumberRef.current)

      const freshKey = nextKeyRef.current++

      setSlots(prev => {
        const oldKey = prev[0].key

        // Remove the old floor after the delay — key is safely captured here
        setTimeout(() => {
          setSlots(s => s.filter(slot => slot.key !== oldKey))
        }, FLOOR_SWAP_DELAY_MS)

        return [
          // Old current: pushed below visible range, removed after delay
          { ...prev[0], isCurrent: false, localY: -FLOOR_HEIGHT },
          // Old next promoted to current at y=0
          { ...prev[1], isCurrent: true, localY: 0 },
          // Fresh next floor above
          { key: freshKey, localY: FLOOR_HEIGHT, isCurrent: false },
        ]
      })
    }

    // ── Apply world transform ────────────────────────────────────
    world.position.set(
      WORLD_OFFSET_X,
      -scrolledYRef.current + WORLD_OFFSET_Y,
      WORLD_OFFSET_Z,
    )
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
        {slots.map(slot => (
          <Floor
            key={slot.key}
            localY={slot.localY}
            cloudT={CLOUD_T}
            scrolledYRef={scrolledYRef}
            isCurrentFloor={slot.isCurrent}
          />
        ))}
      </group>
    </>
  )
}
