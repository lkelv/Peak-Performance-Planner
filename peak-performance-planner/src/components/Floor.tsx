/**
 * Floor.tsx
 * Terrain ribbon, path, flags, background mountains, and trees.
 * Used by World.tsx (legacy). Cloud bank is managed by MountainWorld directly.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { buildTerrainGeo } from './buildTerrainGeo'

const BG_PEAKS = [
  [-55, -45, 22, 46, 0x2a3f1e],
  [-42, -58, 16, 34, 0x253818],
  [ 50, -50, 19, 40, 0x2d4220],
  [ 40, -62, 14, 30, 0x263a1a],
  [-28, -68, 17, 36, 0x22361a],
  [ 28, -60, 15, 34, 0x2a3e1e],
  [-70, -38, 12, 28, 0x1e3016],
  [ 65, -42, 11, 26, 0x203214],
  [ 12, -78, 20, 44, 0x2e4422],
  [-12, -72, 16, 36, 0x243a1c],
  [-88, -28, 10, 24, 0x1c2e14],
  [ 82, -32,  9, 22, 0x1e3016],
  [  0, -88, 22, 48, 0x304624],
  [-60, -72, 18, 40, 0x263c1c],
  [ 58, -68, 17, 38, 0x283e1e],
] as const

const TREE_XZ: [number, number][] = [
  [-7,3],[-9,0],[-6,-3],[-10,-6],[-7,-10],[-4,-13],
  [7,2],[9,-1],[7,-4],[10,-7],[6,-11],[4,-14],
  [-2,-16],[2,-17],[0,-19],[-12,1],[12,0],
  [-11,-9],[11,-10],[0,-21],[-14,-3],[14,-4],
  [-5,-20],[5,-21],[-8,-14],[8,-15],
  [-16,4],[16,3],[-13,-13],[13,-14],
  [-3,5],[4,6],[-18,-5],[18,-6],
]

const FLAG_TS = [0.22, 0.44, 0.66, 0.95]

function Flags({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  return (
    <>
      {FLAG_TS.map((t, i) => {
        const p = curve.getPoint(t)
        return (
          <group key={i} position={[p.x, p.y + 0.7, p.z]}>
            <mesh>
              <cylinderGeometry args={[0.035, 0.035, 1.4, 5]} />
              <meshBasicMaterial color="#cccccc" />
            </mesh>
            <mesh position={[0.28, 0.8, 0]}>
              <planeGeometry args={[0.55, 0.32]} />
              <meshBasicMaterial
                color={i < 2 ? '#33bb55' : '#888899'}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

function BackgroundMountains() {
  return (
    <>
      {BG_PEAKS.map(([x, z, r, h, color], i) => (
        <mesh key={i} position={[x, h / 2, z]}>
          <coneGeometry args={[r, h, 7]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      ))}
    </>
  )
}

function Trees() {
  return (
    <>
      {TREE_XZ.map(([x, z], i) => {
        const s = 0.85 + ((i * 137) % 100) / 182
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.2 * s, 0]}>
              <cylinderGeometry args={[0.06 * s, 0.09 * s, 0.4 * s, 5]} />
              <meshPhongMaterial color="#5a3a10" />
            </mesh>
            {(
              [
                [0.70, 0.38, '#2a5a1a'],
                [0.48, 0.93, '#336620'],
                [0.26, 1.48, '#3a7226'],
              ] as [number, number, string][]
            ).map(([sc, yMult, color], ti) => (
              <mesh key={ti} position={[0, yMult * s, 0]}>
                <coneGeometry args={[sc * s, 0.7 * s, 6]} />
                <meshPhongMaterial color={color} flatShading />
              </mesh>
            ))}
          </group>
        )
      })}
    </>
  )
}

interface FloorProps {
  localY:  number
  curve:   THREE.CatmullRomCurve3
}

export function Floor({ localY, curve }: FloorProps) {
  const terrainGeo = useMemo(() => buildTerrainGeo(), [])
  const pathGeo    = useMemo(() => new THREE.TubeGeometry(curve, 260, 0.14, 7, false), [curve])
  const glowGeo    = useMemo(() => new THREE.TubeGeometry(curve, 260, 0.22, 7, false), [curve])

  return (
    <group position={[0, localY, 0]}>
      <mesh geometry={terrainGeo} castShadow receiveShadow>
        <meshPhongMaterial vertexColors side={THREE.DoubleSide} shininess={8} />
      </mesh>

      <mesh geometry={pathGeo}>
        <meshPhongMaterial color="#c8a050" shininess={14} />
      </mesh>
      <mesh geometry={glowGeo}>
        <meshBasicMaterial color="#f0b050" transparent opacity={0.09} />
      </mesh>

      <Flags curve={curve} />
      <BackgroundMountains />
      <Trees />
    </group>
  )
}