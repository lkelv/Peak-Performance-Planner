import { useMemo } from 'react'
import * as THREE from 'three'

// ── Daytime sky shader ────────────────────────────────────────────
// Deep blue zenith → lighter mid-blue → warm pale horizon
const SKY_VERT = /* glsl */`
  varying vec3 vW;
  void main() {
    vW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SKY_FRAG = /* glsl */`
  varying vec3 vW;
  void main() {
    float h = normalize(vW).y;
    // horizon warm white-yellow, mid sky blue, zenith deep blue
    vec3 hor = vec3(0.88, 0.92, 0.98);
    vec3 mid = vec3(0.42, 0.66, 0.92);
    vec3 zen = vec3(0.12, 0.32, 0.72);
    vec3 gnd = vec3(0.30, 0.38, 0.22);
    vec3 c   = h < 0.0
      ? mix(hor, gnd, clamp(-h * 5.0, 0.0, 1.0))
      : mix(mix(hor, mid, smoothstep(0.0, 0.30, h)), zen, smoothstep(0.25, 1.0, h));
    gl_FragColor = vec4(c, 1.0);
  }
`

// Decorative sky clouds — static positions, no floor dependency
const SKY_CLOUD_DEFS: [number, number, number][] = [
  [-28, 22, -60],
  [ 32, 26, -65],
  [  5, 18, -55],
  [-50, 30, -80],
  [ 55, 28, -75],
  [ 15, 35, -90],
  [-20, 14, -45],
  [ 40, 20, -70],
]

const PUFF_LAYOUT: [number, number, number, number, number][] = [
  [0,    0,    0,   2.2, 0.42],
  [1.6,  0.1,  0,   1.7, 0.38],
  [-1.5, 0.05, 0,   1.8, 0.40],
  [0.6,  0.3,  0.7, 1.3, 0.42],
  [-0.7, 0.2, -0.5, 1.4, 0.40],
]

export function SkyScene() {
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
      }),
    []
  )

  return (
    <>
      {/* Sky dome */}
      <mesh material={skyMat}>
        <sphereGeometry args={[300, 32, 16]} />
      </mesh>

      {/* Sun */}
      <mesh position={[60, 80, -180]}>
        <circleGeometry args={[7, 32]} />
        <meshBasicMaterial color="#fffde0" />
      </mesh>
      {/* Sun halo */}
      <mesh position={[60, 80, -180]}>
        <circleGeometry args={[13, 32]} />
        <meshBasicMaterial color="#fff5aa" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>

      {/* Decorative sky clouds */}
      {SKY_CLOUD_DEFS.map(([x, y, z], ci) => (
        <group key={ci} position={[x, y, z]}>
          {PUFF_LAYOUT.map(([cx, cy, cz, sr, sy], pi) => (
            <mesh key={pi} position={[cx, cy, cz]} scale={[1, sy, 1]}>
              <sphereGeometry args={[sr, 8, 6]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.82} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}
