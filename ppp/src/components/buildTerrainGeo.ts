import * as THREE from 'three'
import { helixPt, SEGS, BAND, TURNS, RIBBON_WIDTH_BASE, RIBBON_WIDTH_TAPER, RIBBON_SLOPE_DROP } from './constants'

export function buildTerrainGeo(): THREE.BufferGeometry {
  const pos: number[] = []
  const nor: number[] = []
  const uv:  number[] = []
  const col: number[] = []
  const idx: number[] = []
  const up = new THREE.Vector3(0, 1, 0)

  for (let i = 0; i <= SEGS; i++) {
    const t   = i / SEGS
    const P   = helixPt(t)
    const PN  = helixPt(Math.min((i + 0.5) / SEGS, 1))

    const tan    = PN.clone().sub(P).normalize()
    const right  = new THREE.Vector3().crossVectors(tan, up).normalize()
    const inward = new THREE.Vector3(0, P.y, 0).sub(P).normalize()
    const bn     = new THREE.Vector3()
      .addScaledVector(up, 0.5)
      .addScaledVector(inward, 0.6)
      .normalize()

    const bw = RIBBON_WIDTH_BASE * (1 - t * RIBBON_WIDTH_TAPER)

    for (let j = 0; j <= BAND; j++) {
      const s   = j / BAND
      const off = (s - 0.5) * bw
      const dy  = (s - 0.5) * RIBBON_SLOPE_DROP

      pos.push(P.x + right.x * off, P.y + right.y * off - dy, P.z + right.z * off)
      nor.push(bn.x, bn.y, bn.z)
      uv.push(s, t * TURNS)

      let r: number, g: number, b: number
      if (t < 0.35) {
        const f = t / 0.35
        r = THREE.MathUtils.lerp(0.18, 0.28, f)
        g = THREE.MathUtils.lerp(0.36, 0.30, f)
        b = THREE.MathUtils.lerp(0.12, 0.16, f)
      } else if (t < 0.7) {
        const f = (t - 0.35) / 0.35
        r = THREE.MathUtils.lerp(0.30, 0.44, f)
        g = THREE.MathUtils.lerp(0.26, 0.38, f)
        b = THREE.MathUtils.lerp(0.18, 0.30, f)
      } else {
        const f = (t - 0.7) / 0.3
        r = THREE.MathUtils.lerp(0.44, 0.92, f)
        g = THREE.MathUtils.lerp(0.38, 0.90, f)
        b = THREE.MathUtils.lerp(0.30, 0.94, f)
      }
      col.push(r, g, b)
    }
  }

  const row = BAND + 1
  for (let i = 0; i < SEGS; i++) {
    for (let j = 0; j < BAND; j++) {
      const a = i * row + j
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(nor, 3))
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uv,  2))
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3))
  geo.setIndex(idx)
  return geo
}
