import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  ROTATION_DIR,
  CAM_POS, CAM_LOOK, CAM_FOV,
  AVATAR_POS, AVATAR_SCALE,
  WORLD_OFFSET_X, WORLD_OFFSET_Y, WORLD_OFFSET_Z
} from './constants'
import { Floor } from './Floor'
import { Avatar } from './Avatar'

// Ensure FLOOR_HEIGHT is defined locally if it was missing from constants
const FLOOR_HEIGHT = 10 
const SCROLL_SPEED = 0.05
const PATH_START_T = 0
const ROT_PER_Y = 0.1

interface WorldProps {
  onFloorChange: (floorNumber: number) => void
}

export function World({ onFloorChange }: WorldProps) {
  const worldRef     = useRef<THREE.Group>(null)
  const frameRef     = useRef(0)
  const avatarRef    = useRef<THREE.Group>(null)

  const scrolledYRef  = useRef(PATH_START_T * FLOOR_HEIGHT)
  const totalRotRef   = useRef(PATH_START_T * FLOOR_HEIGHT * ROT_PER_Y)
  const floorNumberRef = useRef(1)

  const [floorKeys, setFloorKeys] = useState<[number, number]>([0, 1])

  // Create a simple curve to satisfy the FloorProps requirement
  const dummyCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, FLOOR_HEIGHT / 2, 0),
      new THREE.Vector3(0, FLOOR_HEIGHT, 0)
    ])
  }, [])

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

      setFloorKeys(([, next]) => [next, next + 1])
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
        <Floor
          key={floorKeys[0]}
          localY={0}
          curve={dummyCurve}
        />
        <Floor
          key={floorKeys[1]}
          localY={FLOOR_HEIGHT}
          curve={dummyCurve}
        />
      </group>
    </>
  )
}