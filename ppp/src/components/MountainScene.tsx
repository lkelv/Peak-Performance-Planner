/**
 * MountainScene.tsx
 *
 * Top-level canvas wrapper.
 *
 * Lighting strategy:
 *   - A single clean set of lights lives here (ambient + fill + hemi).
 *   - The sun directional light (castShadow) lives in MountainWorld
 *     so it can read totalRot each frame and track the sun's position,
 *     keeping shadows on the opposite side from the sun at all times.
 *   - No duplicate light sets — the old hardcoded lights are gone.
 *
 * Props added for peak / summit flow:
 *   allTasksDone    — passed down to MountainWorld; when true the next
 *                     recycled section becomes peak.glb.
 *   onSummitReached — callback fired once the avatar has walked
 *                     PEAK_STOP_AFTER_HALF_REV revolutions on the peak.
 *                     The parent (home.tsx) stops climbing and triggers
 *                     the fireworks overlay.
 */

import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { SkyScene } from './SkyScene'
import { MountainWorld } from './MountainWorld'
import { CAM_POS, CAM_FOV } from './constants'
import type { AvatarState, Milestone } from './constants'
import * as THREE from 'three'
import {
  TIME_DAWN_START, TIME_DAY_START, TIME_DUSK_START, TIME_NIGHT_START,
  AMBIENT_INTENSITY_DAY, AMBIENT_INTENSITY_DUSK, AMBIENT_INTENSITY_NIGHT,
  AMBIENT_COLOR_DAY, AMBIENT_COLOR_DUSK, AMBIENT_COLOR_NIGHT,
  MOONLIGHT_INTENSITY_NIGHT, MOONLIGHT_COLOR,
  HEMI_SKY_DAY, HEMI_GND_DAY, HEMI_INT_DAY,
  HEMI_SKY_DUSK, HEMI_GND_DUSK, HEMI_INT_DUSK,
  HEMI_SKY_NIGHT, HEMI_GND_NIGHT, HEMI_INT_NIGHT,
} from './constants'

function localHour(): number {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
}

function wrapHour(h: number): number {
  return ((h % 24) + 24) % 24
}

// ─────────────────────────────────────────────────────────────────
// Ambient + fill + hemisphere lights — no shadow casting here.
// The sun directional (castShadow) is owned by MountainWorld.
// ─────────────────────────────────────────────────────────────────
function DynamicLights() {
  const ambientRef   = useRef<THREE.AmbientLight>(null)
  const fillLightRef = useRef<THREE.DirectionalLight>(null)
  const moonLightRef = useRef<THREE.DirectionalLight>(null)
  const hemiRef      = useRef<THREE.HemisphereLight>(null)

  const _ambColor = new THREE.Color()
  const _scratch  = new THREE.Color()
  const _hemiSky  = new THREE.Color()
  const _hemiGnd  = new THREE.Color()

  useFrame(() => {
    const hour = wrapHour(localHour())

    const isDawn  = hour >= TIME_DAWN_START  && hour < TIME_DAY_START
    const isDay   = hour >= TIME_DAY_START   && hour < TIME_DUSK_START
    const isDusk  = hour >= TIME_DUSK_START  && hour < TIME_NIGHT_START

    const dawnT = isDawn ? (hour - TIME_DAWN_START) / (TIME_DAY_START   - TIME_DAWN_START) : 0
    const duskT = isDusk ? (hour - TIME_DUSK_START) / (TIME_NIGHT_START - TIME_DUSK_START) : 0

    let dayW: number, duskW: number
    if (isDay)       { dayW = 1.0;       duskW = 0.0 }
    else if (isDawn) { dayW = dawnT;     duskW = (1 - dawnT) * 0.6 }
    else if (isDusk) { dayW = 1 - duskT; duskW = duskT }
    else             { dayW = 0.0;       duskW = 0.0 }

    const nightW = 1 - Math.max(dayW, duskW)

    if (ambientRef.current) {
      ambientRef.current.intensity =
        dayW * AMBIENT_INTENSITY_DAY + duskW * AMBIENT_INTENSITY_DUSK + nightW * AMBIENT_INTENSITY_NIGHT
      _ambColor
        .set(AMBIENT_COLOR_DAY).multiplyScalar(dayW)
        .add(_scratch.set(AMBIENT_COLOR_DUSK).multiplyScalar(duskW))
        .add(_scratch.set(AMBIENT_COLOR_NIGHT).multiplyScalar(nightW))
      ambientRef.current.color.copy(_ambColor)
    }

    if (moonLightRef.current) {
      moonLightRef.current.intensity = nightW * MOONLIGHT_INTENSITY_NIGHT
    }

    if (hemiRef.current) {
      hemiRef.current.intensity =
        dayW * HEMI_INT_DAY + duskW * HEMI_INT_DUSK + nightW * HEMI_INT_NIGHT
      _hemiSky
        .set(HEMI_SKY_DAY).multiplyScalar(dayW)
        .add(_scratch.set(HEMI_SKY_DUSK).multiplyScalar(duskW))
        .add(_scratch.set(HEMI_SKY_NIGHT).multiplyScalar(nightW))
      _hemiGnd
        .set(HEMI_GND_DAY).multiplyScalar(dayW)
        .add(_scratch.set(HEMI_GND_DUSK).multiplyScalar(duskW))
        .add(_scratch.set(HEMI_GND_NIGHT).multiplyScalar(nightW))
      hemiRef.current.color.copy(_hemiSky)
      hemiRef.current.groundColor.copy(_hemiGnd)
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} color={AMBIENT_COLOR_DAY} intensity={AMBIENT_INTENSITY_DAY} />
      <directionalLight ref={fillLightRef} position={[-20, 20, -10]} intensity={0.4} color="#c8d8f0" />
      <directionalLight ref={moonLightRef} position={[-40, 60, -30]} color={MOONLIGHT_COLOR} intensity={0} />
      <hemisphereLight ref={hemiRef} args={[HEMI_SKY_DAY, HEMI_GND_DAY, HEMI_INT_DAY]} />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Camera controller
// ─────────────────────────────────────────────────────────────────
function CameraController({ viewMode }: { viewMode: 'wide' | 'close' }) {
  const { camera } = useThree()
  const closePos = useMemo(() => CAM_POS.clone(), [])
  const widePos  = useMemo(() => new THREE.Vector3(closePos.x + 15, closePos.y + 10, closePos.z + 25), [closePos])

  useFrame((_state, delta) => {
    const targetPos = viewMode === 'wide' ? widePos : closePos
    camera.position.lerp(targetPos, delta * 2.5)
  })
  return null
}

// ─────────────────────────────────────────────────────────────────
// MountainScene
// ─────────────────────────────────────────────────────────────────
interface MountainSceneProps {
  height?:          number
  isClimbing?:      boolean
  viewMode?:        'wide' | 'close'
  allTasksDone?:    boolean        // passed straight to MountainWorld
  onSummitReached?: () => void     // passed straight to MountainWorld
}

export default function MountainScene({
  height          = window.innerHeight,
  isClimbing      = true,
  viewMode        = 'close',
  allTasksDone    = false,
  onSummitReached,
  height?:       number
  isClimbing?:   boolean
  isSprinting?:  boolean
  viewMode?:     'wide' | 'close'
  avatarState?:  AvatarState
  milestones?:   Milestone[]
  timerProgress?: number
}

export default function MountainScene({
  height        = window.innerHeight,
  isClimbing    = true,
  isSprinting   = false,
  viewMode      = 'close',
  avatarState   = 'WALKING',
  milestones    = [],
  timerProgress = 0,
}: MountainSceneProps) {
  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <Canvas
        shadows
        camera={{
          position: viewMode === 'wide'
            ? [45, 25, 55]
            : (CAM_POS.toArray() as [number, number, number]),
          fov: CAM_FOV,
          near: 0.05,
          far: 600,
        }}
      >
        <CameraController viewMode={viewMode} />

        {/* Ambient + fill + hemisphere — no shadow casting */}
        <DynamicLights />

        {/* Sky dome */}
        <SkyScene />

        {/*
          MountainWorld owns the sun directional light (castShadow).
          allTasksDone triggers peak.glb injection on the next recycle.
          onSummitReached fires after PEAK_STOP_AFTER_HALF_REV revolutions.
        */}
        <Suspense fallback={null}>
          <MountainWorld
            isClimbing={isClimbing}
            allTasksDone={allTasksDone}
            onSummitReached={onSummitReached}
            isSprinting={isSprinting}
            avatarState={avatarState}
            milestones={milestones}
            timerProgress={timerProgress}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}