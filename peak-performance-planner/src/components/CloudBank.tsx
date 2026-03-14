import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SECTION_HEIGHT, CLOUD_FADE, CLOUD_THICK } from './constants'

interface Puff {
  pos: [number, number, number]
  r: number
  scaleY: number
}

interface CloudBankProps {
  localY: number
  scrolledYRef: React.RefObject<number>
  isCurrentFloor: boolean
  cloudT: number
}

export function CloudBank({ localY, scrolledYRef, isCurrentFloor, cloudT }: CloudBankProps) {
  const groupRef = useRef<THREE.Group>(null)
  const matsRef  = useRef<THREE.MeshStandardMaterial[]>([])

  const puffs = useMemo<Puff[]>(() => {
    const arr: Puff[] = []
    for (let i = 0; i < 52; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = Math.random() * 22
      arr.push({
        pos: [Math.cos(angle) * rad, (Math.random() - 0.5) * 4, Math.sin(angle) * rad],
        r:      3.5 + Math.random() * 5,
        scaleY: 0.30 + Math.random() * 0.25,
      })
    }
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2
      const rad   = 22 + Math.random() * 18
      arr.push({
        pos: [Math.cos(angle) * rad, (Math.random() - 0.5) * 3, Math.sin(angle) * rad],
        r:      2.5 + Math.random() * 4,
        scaleY: 0.22 + Math.random() * 0.20,
      })
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    groupRef.current.rotation.y += delta * 0.035

    // scrolledYRef is in [0, SECTION_HEIGHT).
    // cloudLocalY within the section = cloudT * SECTION_HEIGHT.
    // distBelow > 0 means cloud is still above the avatar.
    const cloudFloorY = cloudT * SECTION_HEIGHT
    const scrolled    = scrolledYRef.current ?? 0
    const distBelow   = cloudFloorY - scrolled

    let opacity = 0
    if (isCurrentFloor) {
      if (distBelow >= 0 && distBelow < CLOUD_FADE) {
        opacity = 1 - distBelow / CLOUD_FADE
      } else if (distBelow < 0 && distBelow > -CLOUD_THICK) {
        opacity = 1 - Math.abs(distBelow) / CLOUD_THICK
      }
      opacity = Math.max(0, Math.min(1, opacity))
    }

    matsRef.current.forEach(m => { m.opacity = opacity * 0.94 })
  })

  return (
    <group ref={groupRef} position={[0, localY, 0]}>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.pos} scale={[1, p.scaleY, 1]}>
          <sphereGeometry args={[p.r, 8, 6]} />
          <meshStandardMaterial
            ref={el => { if (el) matsRef.current[i] = el }}
            color="#eef2ff"
            transparent
            opacity={0}
            roughness={1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
