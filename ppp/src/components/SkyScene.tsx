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
    </>
  )
}