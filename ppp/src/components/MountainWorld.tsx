/**
 * MountainWorld.tsx
 *
 * Owns the sun directional light (castShadow). Updates its position
 * each frame so the shadow always falls opposite to the current sun
 * direction, which rotates with the world via totalRot.
 *
 * GLB mountain clones have castShadow/receiveShadow DISABLED to prevent
 * the harsh self-shadowing texture banding seen when shadows are on.
 * Only the ground plane and avatar receive/cast shadows.
 */

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
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
  GLB_PATH,
  SECTION_SCALE,
  SECTION_OFFSET_X,
  SECTION_OFFSET_Z,
  SECTION_ROTATION_Y,
  CAM_POS_START,
  CAM_FOV_START,
  CAM_INTRO_SEC,
  CAM_LOOK_START,
  CAM_FLAG_POS,
  CAM_FLAG_LOOK,
  CAM_FLAG_FOV,
  SPRINT_SPEED_MULT,
  TIME_DAWN_START, TIME_DAY_START, TIME_DUSK_START, TIME_NIGHT_START,
  DIRLIGHT_INTENSITY_DAY, DIRLIGHT_INTENSITY_DUSK, DIRLIGHT_INTENSITY_NIGHT,
} from './constants'
import type { AvatarState, Milestone } from './constants'
import { Avatar } from './Avatar'
import { CloudBank } from './CloudBank'
import { GroundPlane } from './GroundPlane'
import { CelestialBodies } from './SkyScene'
import { Flag } from './Flag'

// ── Sun light constants ───────────────────────────────────────────
// The sun directional light orbits at this radius around world origin.
// Its XZ position is the OPPOSITE of the sun disc's position in the sky,
// so shadows fall away from the sun.
const SUN_LIGHT_RADIUS = 60   // world-units
const SUN_LIGHT_Y      = 80   // fixed height

// How far above the avatar the cloud starts fading the ground out.
const GROUND_FADE_START_Y =  8
const GROUND_FADE_END_Y   = -2

function localHour(): number {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
}
function wrapHour(h: number) { return ((h % 24) + 24) % 24 }

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
// Background mountains
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
  const groupRef = useRef<THREE.Group>(null)
  const opacity  = useRef(0)

  useFrame((_, delta) => {
    opacity.current = Math.min(opacity.current + delta * 0.6, 1)
    groupRef.current?.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        const mat = mesh.material as THREE.MeshPhongMaterial
        mat.transparent = true
        mat.opacity = opacity.current
        mat.needsUpdate = true
      }
    })
  })

  const { farPeaks, midPeaks, nearPeaks, snowCaps } = makeMountains(generation)
  const tallFar = farPeaks.filter(([,,, h]) => h > 55)

  return (
    <group ref={groupRef}>
      {farPeaks.map(([x, z, r, h, color], i) => (
        <mesh key={`fp${i}`} position={[x, h / 2 - 8, z]}>
          <coneGeometry args={[r, h, 7]} />
          <meshPhongMaterial color={color} flatShading transparent opacity={0} />
        </mesh>
      ))}
      {snowCaps.map(([x, z, r, h], i) => (
        <mesh key={`sc${i}`} position={[x, tallFar[i][3] - h * 0.5 - 8, z]}>
          <coneGeometry args={[r, h * 2, 7]} />
          <meshPhongMaterial color={0xeef4ff} flatShading transparent opacity={0} />
        </mesh>
      ))}
      {midPeaks.map(([x, z, r, h, color], i) => (
        <mesh key={`mp${i}`} position={[x, h / 2 - 5, z]}>
          <coneGeometry args={[r, h, 7]} />
          <meshPhongMaterial color={color} flatShading transparent opacity={0} />
        </mesh>
      ))}
      {nearPeaks.map(([x, z, r, h, color], i) => (
        <mesh key={`np${i}`} position={[x, h / 2 - 3, z]}>
          <coneGeometry args={[r, h, 6]} />
          <meshPhongMaterial color={color} flatShading transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Background trees
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
  isClimbing?:    boolean
  isSprinting?:   boolean
  avatarState?:   AvatarState
  milestones?:    Milestone[]
  timerProgress?: number
}

export function MountainWorld({
  isClimbing    = true,
  isSprinting   = false,
  avatarState   = 'WALKING',
  milestones    = [],
  timerProgress = 0,
}: MountainWorldProps) {

  // ── GLB clones — castShadow/receiveShadow OFF to prevent texture banding ──
  const { scene } = useGLTF(GLB_PATH)
  const clones = useMemo(() => {
    return Array.from({ length: POOL }, () => {
      const clone = scene.clone(true)
      clone.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.isMesh) {
          // Shadows disabled on the mountain GLB — they cause harsh
          // self-shadow banding on the low-poly geometry. The avatar
          // and ground plane still cast/receive shadows correctly.
          mesh.castShadow    = false
          mesh.receiveShadow = false
        }
      })
      return clone
    })
  }, [scene])

  // ── Sun directional light ref — owned here so we can update from totalRot ──
  const sunLightRef = useRef<THREE.DirectionalLight>(null)

  const _camPosLerp  = new THREE.Vector3()
  const _camLookLerp = new THREE.Vector3()
  const camProgressRef = useRef(0)

  const worldRef       = useRef<THREE.Group>(null)
  const bgMountainsRef = useRef<THREE.Group>(null)
  const bgTreesRef     = useRef<THREE.Group>(null)
  const avatarRef      = useRef<THREE.Group>(null)
  const cloudRef       = useRef<THREE.Group>(null)
  const groundRef      = useRef<THREE.Group>(null)

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

  const mountainSpawnScrollY = useRef(0)

  const [secIndices,           setSecIndices]           = useState<[number,number,number,number,number]>([0,1,2,3,4])
  const [bgMountainGeneration, setBgMountainGeneration] = useState(0)
  const [groundGone,           setGroundGone]           = useState(false)

  const handleCloudPassThrough = () => {
    mountainSpawnScrollY.current = totalScrollY.current
    setBgMountainGeneration(g => g + 1)
    setGroundGone(true)
  }

  // Track spawned flag positions (in avatar-relative space, stored as scrollY at spawn time)
  const spawnedFlagsRef = useRef<Map<string, { scrollY: number; mode: 'pop' | 'rise' }>>(new Map())

  // Camera choreography state for flag celebrations
  const flagCamProgressRef = useRef(0)

  useFrame(({ camera }, delta) => {
    frameRef.current++

    if (isClimbing) {
      const speedMult = isSprinting ? SPRINT_SPEED_MULT : 1
      const dy = CLIMB_SPEED * delta * speedMult
      totalScrollY.current += dy
      totalRot.current     += ROT_SPEED * delta * speedMult
      for (let i = 0; i < POOL; i++) secY.current[i] -= dy
      cloudY.current -= dy
    }

    for (let i = 0; i < POOL; i++) {
      const g = REFS[i].current
      if (g) g.position.y = secY.current[i]
    }

    if (cloudRef.current) cloudRef.current.position.y = cloudY.current

    const sharedRotY = ROTATION_DIR * totalRot.current

    if (bgMountainsRef.current) {
      bgMountainsRef.current.position.y = mountainSpawnScrollY.current - totalScrollY.current
      bgMountainsRef.current.rotation.y = sharedRotY
    }
    if (bgTreesRef.current) {
      bgTreesRef.current.position.y = -(totalScrollY.current % 200)
      bgTreesRef.current.rotation.y = sharedRotY
    }

    // ── Ground plane: scroll + fade ───────────────────────────────
    if (groundRef.current && !groundGone) {
      groundRef.current.position.y = -(totalScrollY.current % 200)
      const cy      = cloudY.current
      const fadeT   = 1 - THREE.MathUtils.clamp(
        (cy - GROUND_FADE_END_Y) / (GROUND_FADE_START_Y - GROUND_FADE_END_Y), 0, 1,
      )
      const opacity = 1 - fadeT
      groundRef.current.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.isMesh) {
          const mat = mesh.material as THREE.MeshPhongMaterial
          mat.transparent = opacity < 1
          mat.opacity = opacity
          mat.needsUpdate = true
        }
      })
    }

    // ── Sun directional light — position tracks world rotation ────
    // The sun disc in CelestialBodies is at angle = sharedRotY on the
    // far side of the scene. We place the light at the OPPOSITE XZ angle
    // so that shadows fall away from the sun regardless of how far the
    // avatar has rotated around the mountain.
    if (sunLightRef.current) {
      const hour = wrapHour(localHour())
      const isDawn  = hour >= TIME_DAWN_START  && hour < TIME_DAY_START
      const isDay   = hour >= TIME_DAY_START   && hour < TIME_DUSK_START
      const isDusk  = hour >= TIME_DUSK_START  && hour < TIME_NIGHT_START
      const isNight = hour >= TIME_NIGHT_START || hour < TIME_DAWN_START

      const dawnT = isDawn ? (hour - TIME_DAWN_START) / (TIME_DAY_START   - TIME_DAWN_START) : 0
      const duskT = isDusk ? (hour - TIME_DUSK_START) / (TIME_NIGHT_START - TIME_DUSK_START) : 0

      let dayW: number, duskW: number
      if (isDay)       { dayW = 1.0;       duskW = 0.0 }
      else if (isDawn) { dayW = dawnT;     duskW = (1 - dawnT) * 0.6 }
      else if (isDusk) { dayW = 1 - duskT; duskW = duskT }
      else             { dayW = 0.0;       duskW = 0.0 }

      const nightW = 1 - Math.max(dayW, duskW)

      sunLightRef.current.intensity =
        dayW * DIRLIGHT_INTENSITY_DAY + duskW * DIRLIGHT_INTENSITY_DUSK + nightW * DIRLIGHT_INTENSITY_NIGHT

      // Rotate opposite to sharedRotY so it always shines FROM the sun's side
      const lightAngle = sharedRotY + Math.PI   // opposite side of the world
      sunLightRef.current.position.set(
        Math.cos(lightAngle) * SUN_LIGHT_RADIUS,
        SUN_LIGHT_Y,
        Math.sin(lightAngle) * SUN_LIGHT_RADIUS,
      )
    }

    // Section recycling
    const bot = cursor.current
    if (secY.current[bot] < RECYCLE_THRESHOLD) {
      const top = (cursor.current + POOL - 1) % POOL
      secY.current[bot]   = secY.current[top] + SECTION_HEIGHT
      secIdx.current[bot] = secIdx.current[bot] + POOL
      cursor.current      = (cursor.current + 1) % POOL
      spawnCountRef.current += 1
      setSecIndices([...secIdx.current] as [number,number,number,number,number])
      if (spawnCountRef.current - lastCloudSpawn.current >= CLOUD_SPAWN_INTERVAL) {
        lastCloudSpawn.current = spawnCountRef.current
        cloudY.current = Math.max(...secY.current) + CLOUD_ABOVE_OFFSET
      }
    }

    if (worldRef.current) {
      worldRef.current.position.set(WORLD_OFFSET_X, WORLD_OFFSET_Y, WORLD_OFFSET_Z)
      worldRef.current.rotation.y = sharedRotY
    }

    // ── Spawn / despawn flags for milestones ─────────────────────
    for (const ms of milestones) {
      if (ms.isRendered && !spawnedFlagsRef.current.has(ms.id)) {
        const mode = ms.isReached ? 'pop' : 'rise'
        spawnedFlagsRef.current.set(ms.id, {
          scrollY: totalScrollY.current,
          mode,
        })
      }
    }
    // Clean up flags that are no longer rendered (user clicked Resume)
    for (const id of spawnedFlagsRef.current.keys()) {
      const ms = milestones.find(m => m.id === id)
      if (!ms || !ms.isRendered) {
        spawnedFlagsRef.current.delete(id)
      }
    }

    // ── Camera zoom pan ──────────────────────────────────────────
    // Flag camera is active during CELEBRATING and IDLE (post-milestone
    // pause). It releases when avatarState returns to WALKING (Resume).
    // If the user ticks another task while already zoomed out, keep
    // the flag cam to avoid a zoom-in-then-out stutter.
    const wantsFlagCam =
      avatarState === 'CELEBRATING' ||
      avatarState === 'IDLE' ||
      (avatarState === 'SPRINTING' && flagCamProgressRef.current > 0.5)

    if (wantsFlagCam) {
      // Zoom out to flag celebration view
      flagCamProgressRef.current = Math.min(1, flagCamProgressRef.current + delta * 1.5)
    } else {
      flagCamProgressRef.current = Math.max(0, flagCamProgressRef.current - delta * 1.5)
    }

    if (flagCamProgressRef.current > 0.01) {
      // Flag celebration camera takes priority
      const ft = flagCamProgressRef.current
      const fe = ft < 0.5 ? 2 * ft * ft : 1 - Math.pow(-2 * ft + 2, 2) / 2
      _camPosLerp.lerpVectors(CAM_POS, CAM_FLAG_POS, fe)
      _camLookLerp.lerpVectors(CAM_LOOK, CAM_FLAG_LOOK, fe)
      camera.position.copy(_camPosLerp)
      camera.lookAt(_camLookLerp)
      const cam = camera as THREE.PerspectiveCamera
      const targetFov = CAM_FOV + (CAM_FLAG_FOV - CAM_FOV) * fe
      if (Math.abs(cam.fov - targetFov) > 0.01) { cam.fov = targetFov; cam.updateProjectionMatrix() }
    } else {
      // Normal intro/climbing camera
      if (isClimbing) {
        camProgressRef.current = Math.min(1, camProgressRef.current + delta / CAM_INTRO_SEC)
      } else {
        camProgressRef.current = Math.max(0, camProgressRef.current - delta / CAM_INTRO_SEC)
      }
      const p = camProgressRef.current
      const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      _camPosLerp.lerpVectors(CAM_POS_START, CAM_POS, t)
      _camLookLerp.lerpVectors(CAM_LOOK_START, CAM_LOOK, t)
      camera.position.copy(_camPosLerp)
      camera.lookAt(_camLookLerp)
      const cam = camera as THREE.PerspectiveCamera
      const targetFov = CAM_FOV_START + (CAM_FOV - CAM_FOV_START) * t
      if (cam.fov !== targetFov) { cam.fov = targetFov; cam.updateProjectionMatrix() }
    }
  })

  const getSectionTransform = (sectionIndex: number) => {
    const isOdd = sectionIndex % 2 === 1
    const rotY  = SECTION_ROTATION_Y + (isOdd ? Math.PI : 0)
    const offX  = isOdd ? -SECTION_OFFSET_X : SECTION_OFFSET_X
    return { rotY, offX }
  }

  return (
    <>
      {/*
        Sun directional light — owned here so it can read totalRot.
        castShadow ON, but only affects the ground plane and avatar
        since GLB meshes have castShadow/receiveShadow = false.
        Position is updated each frame to orbit opposite to the sun disc.
      */}
      <directionalLight
        ref={sunLightRef}
        color="#fff8e8"
        intensity={DIRLIGHT_INTENSITY_DAY}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
        shadow-camera-near={0.5}
        shadow-camera-far={150}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        position={[SUN_LIGHT_RADIUS, SUN_LIGHT_Y, 0]}
      />

      <Avatar ref={avatarRef} position={AVATAR_POS} scale={AVATAR_SCALE} isClimbing={isClimbing} avatarState={avatarState} />

      {/* Milestone flags — rendered near the avatar position */}
      {milestones.filter(m => m.isRendered).map((ms) => {
        const flagData = spawnedFlagsRef.current.get(ms.id)
        if (!flagData) return null
        // Place the flag at the avatar's X/Z but slightly offset so it's visible
        // The Y offset compensates for scroll since spawn
        const yOffset = flagData.scrollY - totalScrollY.current
        return (
          <Flag
            key={ms.id}
            position={[AVATAR_POS[0] + 0.8, AVATAR_POS[1] + yOffset, AVATAR_POS[2] - 0.3]}
            mode={flagData.mode}
            color={ms.isReached ? '#33bb55' : '#f0c060'}
          />
        )
      })}

      {!groundGone && <GroundPlane ref={groundRef} />}

      {/* Mountains + celestial bodies share bgMountainsRef rotation */}
      <group ref={bgMountainsRef}>
        <BackgroundMountains key={bgMountainGeneration} generation={bgMountainGeneration} />
        <CelestialBodies />
      </group>

      <group ref={bgTreesRef}>
        <BackgroundTrees />
      </group>

      <group ref={worldRef}>
        {([ref0, ref1, ref2, ref3, ref4] as const).map((ref, i) => {
          const { rotY, offX } = getSectionTransform(secIndices[i])
          return (
            <group key={i} ref={ref}>
              <primitive
                object={clones[i]}
                position={[offX, 0, SECTION_OFFSET_Z]}
                rotation={[0, rotY, 0]}
                scale={SECTION_SCALE}
              />
            </group>
          )
        })}
        <CloudBank groupRef={cloudRef} onPassThrough={handleCloudPassThrough} />
      </group>
    </>
  )
}

useGLTF.preload(GLB_PATH)