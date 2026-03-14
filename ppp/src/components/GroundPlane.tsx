/**
 * GroundPlane.tsx
 *
 * Flat terrain visible at the mountain base.
 * Positioned and faded by MountainWorld via the groupRef it accepts.
 *
 * - Scrolls down with totalScrollY (same rhythm as background trees)
 * - Fades to invisible as the cloud bank approaches (opacity driven externally)
 * - After the first cloud pass-through the parent stops rendering it entirely
 */

import { useMemo, forwardRef } from 'react'
import * as THREE from 'three'

// ── Tuning ────────────────────────────────────────────────────────
const PLANE_W       = 80    // world-units wide  (X)
const PLANE_D       = 80    // world-units deep  (Z)
const SEGS_W        = 32
const SEGS_D        = 32
const HEIGHT_NOISE  = 0.15  // max vertex bump
const PATH_WIDTH    = 2.2   // central dirt-path strip width

const COL_GRASS_A = new THREE.Color('#4a8a28')
const COL_GRASS_B = new THREE.Color('#3a7020')
const COL_DIRT    = new THREE.Color('#6a4822')
const COL_PATH    = new THREE.Color('#c8a050')

function rand(seed: number) {
  const x = Math.sin(seed + 1) * 43758.5453
  return x - Math.floor(x)
}

function buildGeo(): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [],
        col: number[] = [], uv:  number[] = [], idx: number[] = []

  const cols = SEGS_W + 1
  const rows = SEGS_D + 1

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = c / SEGS_W
      const v = r / SEGS_D
      const x = (u - 0.5) * PLANE_W
      const z = (v - 0.5) * PLANE_D

      // Height noise, damped at edges so perimeter stays flat
      const edgeFade = Math.min(u, 1 - u, v, 1 - v) * 6
      const y = rand(r * 100 + c) * HEIGHT_NOISE * Math.min(edgeFade, 1)

      pos.push(x, y, z)
      nor.push(0, 1, 0)
      uv.push(u, v)

      // Vertex colour
      const dist = Math.abs(x)
      let vc: THREE.Color
      if (dist < PATH_WIDTH * 0.5) {
        vc = COL_PATH
      } else if (dist < PATH_WIDTH) {
        const t = (dist - PATH_WIDTH * 0.5) / (PATH_WIDTH * 0.5)
        vc = COL_PATH.clone().lerp(COL_GRASS_A, t)
      } else {
        const checker = (Math.floor(u * 10) + Math.floor(v * 10)) % 2
        vc = (checker ? COL_GRASS_A : COL_GRASS_B).clone()
        // Darken toward outer edge
        const edgeTint = 1 - Math.min(edgeFade, 1)
        vc.lerp(COL_DIRT, edgeTint * 0.55)
      }
      col.push(vc.r, vc.g, vc.b)
    }
  }

  for (let r = 0; r < SEGS_D; r++) {
    for (let c = 0; c < SEGS_W; c++) {
      const a = r * cols + c
      const b = a + 1, cc = a + cols, d = cc + 1
      idx.push(a, cc, b, b, cc, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(nor, 3))
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3))
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uv,  2))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

// groupRef is forwarded so MountainWorld can drive position.y and opacity
export const GroundPlane = forwardRef<THREE.Group>((_, ref) => {
  const geo = useMemo(() => buildGeo(), [])

  return (
    <group ref={ref}>
      {/* Top surface — vertex colours */}
      <mesh geometry={geo} receiveShadow castShadow>
        <meshPhongMaterial vertexColors side={THREE.FrontSide} shininess={3} />
      </mesh>
      {/* Underside — solid dirt so the slab looks thick from below */}
      <mesh geometry={geo}>
        <meshPhongMaterial color={COL_DIRT} side={THREE.BackSide} shininess={0} />
      </mesh>
    </group>
  )
})

GroundPlane.displayName = 'GroundPlane'