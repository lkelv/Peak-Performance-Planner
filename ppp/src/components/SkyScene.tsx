/**
 * SkyScene.tsx
 *
 * Exports two separate components so the sky and the sun/moon can
 * live in different parts of the scene graph:
 *
 *   <SkyDome />         — static backdrop, rendered in MountainScene
 *                         outside any rotating group.
 *
 *   <CelestialBodies /> — sun + moon discs, rendered inside the
 *                         bgMountainsRef rotation group in MountainWorld
 *                         so they orbit with the world as the avatar runs.
 *
 * All colours, sizes and arc positions are driven by the user's LOCAL TIME
 * via constants in constants.ts — tweak those to adjust the look.
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  TIME_DAWN_START, TIME_DAY_START, TIME_DUSK_START, TIME_NIGHT_START,
  CELESTIAL_ORBIT_RADIUS, CELESTIAL_HEIGHT_PEAK, CELESTIAL_HEIGHT_MIN,
  SUN_RADIUS, SUN_HALO_RADIUS, SUN_HALO_OPACITY,
  SUN_COLOR_DAY, SUN_COLOR_DUSK, SUN_HALO_COLOR, SUN_HALO_COLOR_DUSK,
  MOON_RADIUS, MOON_HALO_RADIUS, MOON_HALO_OPACITY, MOON_COLOR, MOON_HALO_COLOR,
  SKY_COLORS_DAY, SKY_COLORS_DUSK, SKY_COLORS_NIGHT,
} from './constants'

// ─────────────────────────────────────────────────────────────────
// Time helpers
// ─────────────────────────────────────────────────────────────────

function localHour(): number {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
}

function wrapHour(h: number): number {
  return ((h % 24) + 24) % 24
}

function sunArcT(hour: number): number {
  const span = TIME_NIGHT_START - TIME_DAWN_START
  return THREE.MathUtils.clamp((hour - TIME_DAWN_START) / span, 0, 1)
}

function moonArcT(hour: number): number {
  const riseH = TIME_NIGHT_START
  const setH  = TIME_DAWN_START + 24
  const h     = hour < riseH ? hour + 24 : hour
  return THREE.MathUtils.clamp((h - riseH) / (setH - riseH), 0, 1)
}

/**
 * Semicircular arc position.
 * t=0 → east horizon, t=0.5 → zenith, t=1 → west horizon.
 * The arc is placed far enough away (CELESTIAL_ORBIT_RADIUS) that
 * it always appears on the horizon/sky regardless of camera position.
 */
function celestialPos(t: number): THREE.Vector3 {
  const angle = Math.PI * t
  return new THREE.Vector3(
    Math.cos(angle) * CELESTIAL_ORBIT_RADIUS,
    Math.sin(angle) * (CELESTIAL_HEIGHT_PEAK - CELESTIAL_HEIGHT_MIN) + CELESTIAL_HEIGHT_MIN,
    -CELESTIAL_ORBIT_RADIUS * 1.5,
  )
}

function lerpRGB(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    THREE.MathUtils.lerp(a[0], b[0], t),
    THREE.MathUtils.lerp(a[1], b[1], t),
    THREE.MathUtils.lerp(a[2], b[2], t),
  ]
}

// ─────────────────────────────────────────────────────────────────
// Sky dome shader — uniforms updated per frame for time-of-day colour
// ─────────────────────────────────────────────────────────────────

const SKY_VERT = /* glsl */`
  varying vec3 vW;
  void main() {
    vW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SKY_FRAG = /* glsl */`
  uniform vec3 uHorizon;
  uniform vec3 uMid;
  uniform vec3 uZenith;
  uniform vec3 uGround;
  varying vec3 vW;
  void main() {
    float h = normalize(vW).y;
    vec3 c = h < 0.0
      ? mix(uHorizon, uGround, clamp(-h * 5.0, 0.0, 1.0))
      : mix(mix(uHorizon, uMid, smoothstep(0.0, 0.30, h)), uZenith, smoothstep(0.25, 1.0, h));
    gl_FragColor = vec4(c, 1.0);
  }
`

// ─────────────────────────────────────────────────────────────────
// SkyDome — static backdrop, no rotation needed
// Place this in MountainScene outside any rotating group.
// ─────────────────────────────────────────────────────────────────

export function SkyDome() {
  const skyUniforms = useMemo(() => ({
    uHorizon: { value: new THREE.Vector3(...SKY_COLORS_DAY.horizon) },
    uMid:     { value: new THREE.Vector3(...SKY_COLORS_DAY.mid)     },
    uZenith:  { value: new THREE.Vector3(...SKY_COLORS_DAY.zenith)  },
    uGround:  { value: new THREE.Vector3(...SKY_COLORS_DAY.ground)  },
  }), [])

  const skyMat = useMemo(
    () => new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: skyUniforms,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
    }),
    [skyUniforms],
  )

  useFrame(() => {
    const hour = wrapHour(localHour())

    const isDawn  = hour >= TIME_DAWN_START  && hour < TIME_DAY_START
    const isDay   = hour >= TIME_DAY_START   && hour < TIME_DUSK_START
    const isDusk  = hour >= TIME_DUSK_START  && hour < TIME_NIGHT_START

    const dawnT = isDawn ? (hour - TIME_DAWN_START) / (TIME_DAY_START   - TIME_DAWN_START) : 0
    const duskT = isDusk ? (hour - TIME_DUSK_START) / (TIME_NIGHT_START - TIME_DUSK_START) : 0

    let horizon: [number,number,number]
    let mid:     [number,number,number]
    let zenith:  [number,number,number]
    let ground:  [number,number,number]

    if (isDay) {
      horizon = SKY_COLORS_DAY.horizon as [number,number,number]
      mid     = SKY_COLORS_DAY.mid     as [number,number,number]
      zenith  = SKY_COLORS_DAY.zenith  as [number,number,number]
      ground  = SKY_COLORS_DAY.ground  as [number,number,number]
    } else if (isDawn) {
      horizon = lerpRGB(SKY_COLORS_NIGHT.horizon as [number,number,number], SKY_COLORS_DUSK.horizon as [number,number,number], dawnT)
      mid     = lerpRGB(SKY_COLORS_NIGHT.mid     as [number,number,number], SKY_COLORS_DAY.mid      as [number,number,number], dawnT)
      zenith  = lerpRGB(SKY_COLORS_NIGHT.zenith  as [number,number,number], SKY_COLORS_DAY.zenith   as [number,number,number], dawnT)
      ground  = lerpRGB(SKY_COLORS_NIGHT.ground  as [number,number,number], SKY_COLORS_DAY.ground   as [number,number,number], dawnT)
    } else if (isDusk) {
      horizon = lerpRGB(SKY_COLORS_DAY.horizon   as [number,number,number], SKY_COLORS_DUSK.horizon  as [number,number,number], duskT)
      mid     = lerpRGB(SKY_COLORS_DAY.mid       as [number,number,number], SKY_COLORS_NIGHT.mid     as [number,number,number], duskT)
      zenith  = lerpRGB(SKY_COLORS_DAY.zenith    as [number,number,number], SKY_COLORS_NIGHT.zenith  as [number,number,number], duskT)
      ground  = lerpRGB(SKY_COLORS_DAY.ground    as [number,number,number], SKY_COLORS_DUSK.ground   as [number,number,number], duskT)
    } else {
      horizon = SKY_COLORS_NIGHT.horizon as [number,number,number]
      mid     = SKY_COLORS_NIGHT.mid     as [number,number,number]
      zenith  = SKY_COLORS_NIGHT.zenith  as [number,number,number]
      ground  = SKY_COLORS_NIGHT.ground  as [number,number,number]
    }

    skyUniforms.uHorizon.value.set(...horizon)
    skyUniforms.uMid.value.set(...mid)
    skyUniforms.uZenith.value.set(...zenith)
    skyUniforms.uGround.value.set(...ground)
  })

  return (
    <mesh material={skyMat}>
      <sphereGeometry args={[300, 32, 16]} />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────
// CelestialBodies — sun + moon discs.
//
// Place this INSIDE the bgMountainsRef group in MountainWorld:
//
//   <group ref={bgMountainsRef}>
//     <BackgroundMountains ... />
//     <CelestialBodies />        ← here
//   </group>
//
// bgMountainsRef.rotation.y = sharedRotY each frame, so the sun and
// moon sweep around the horizon as the avatar runs — no extra code needed.
// ─────────────────────────────────────────────────────────────────

export function CelestialBodies() {
  const sunRef        = useRef<THREE.Mesh>(null)
  const sunHaloRef    = useRef<THREE.Mesh>(null)
  const sunMatRef     = useRef<THREE.MeshBasicMaterial>(null)
  const sunHaloMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const moonRef       = useRef<THREE.Mesh>(null)
  const moonHaloRef   = useRef<THREE.Mesh>(null)

  // Initialise at current local time so there's no pop on first frame
  const initHour    = wrapHour(localHour())
  const initSunPos  = celestialPos(sunArcT(initHour))
  const initMoonPos = celestialPos(moonArcT(initHour))

  useFrame(() => {
    const hour = wrapHour(localHour())

    const isDawn  = hour >= TIME_DAWN_START  && hour < TIME_DAY_START
    const isDusk  = hour >= TIME_DUSK_START  && hour < TIME_NIGHT_START
    const isNight = hour >= TIME_NIGHT_START || hour < TIME_DAWN_START

    const dawnT = isDawn ? (hour - TIME_DAWN_START) / (TIME_DAY_START   - TIME_DAWN_START) : 0
    const duskT = isDusk ? (hour - TIME_DUSK_START) / (TIME_NIGHT_START - TIME_DUSK_START) : 0

    // ── Sun ──────────────────────────────────────────────────────
    const sunVisible = !isNight
    if (sunRef.current) {
      sunRef.current.visible = sunVisible
      if (sunHaloRef.current) sunHaloRef.current.visible = sunVisible

      if (sunVisible) {
        const pos = celestialPos(sunArcT(hour))
        sunRef.current.position.copy(pos)
        if (sunHaloRef.current) sunHaloRef.current.position.copy(pos)

        const duskBlend = isDusk ? duskT : isDawn ? 1 - dawnT : 0
        sunMatRef.current?.color.lerpColors(
          new THREE.Color(SUN_COLOR_DAY),
          new THREE.Color(SUN_COLOR_DUSK),
          duskBlend,
        )
        sunHaloMatRef.current?.color.lerpColors(
          new THREE.Color(SUN_HALO_COLOR),
          new THREE.Color(SUN_HALO_COLOR_DUSK),
          duskBlend,
        )
      }
    }

    // ── Moon ─────────────────────────────────────────────────────
    const moonVisible = isNight
    if (moonRef.current) {
      moonRef.current.visible = moonVisible
      if (moonHaloRef.current) moonHaloRef.current.visible = moonVisible

      if (moonVisible) {
        const pos = celestialPos(moonArcT(hour))
        moonRef.current.position.copy(pos)
        if (moonHaloRef.current) moonHaloRef.current.position.copy(pos)
      }
    }
  })

  return (
    <>
      <mesh ref={sunRef} position={initSunPos.toArray()}>
        <circleGeometry args={[SUN_RADIUS, 32]} />
        <meshBasicMaterial ref={sunMatRef} color={SUN_COLOR_DAY} />
      </mesh>

      <mesh ref={sunHaloRef} position={initSunPos.toArray()}>
        <circleGeometry args={[SUN_HALO_RADIUS, 32]} />
        <meshBasicMaterial
          ref={sunHaloMatRef}
          color={SUN_HALO_COLOR}
          transparent
          opacity={SUN_HALO_OPACITY}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={moonRef} position={initMoonPos.toArray()}>
        <circleGeometry args={[MOON_RADIUS, 32]} />
        <meshBasicMaterial color={MOON_COLOR} />
      </mesh>

      <mesh ref={moonHaloRef} position={initMoonPos.toArray()}>
        <circleGeometry args={[MOON_HALO_RADIUS, 32]} />
        <meshBasicMaterial
          color={MOON_HALO_COLOR}
          transparent
          opacity={MOON_HALO_OPACITY}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  )
}

// ── Legacy alias so any existing import of SkyScene keeps working ──
/** @deprecated Import SkyDome instead */
export function SkyScene() {
  return <SkyDome />
}