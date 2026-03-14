import type { CSSProperties } from 'react'

interface HUDProps {
  goalName?: string
  floor: number
}

const hudStyle: CSSProperties = {
  position: 'absolute',
  top: 14,
  left: 14,
  background: 'rgba(6,8,18,0.72)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10,
  padding: '11px 15px',
  color: '#e8e2d9',
  fontFamily: 'system-ui, sans-serif',
  pointerEvents: 'none',
  userSelect: 'none',
}

const badgeStyle: CSSProperties = {
  position: 'absolute',
  bottom: 14,
  right: 14,
  background: 'rgba(6,8,18,0.72)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8,
  padding: '8px 13px',
  color: '#a0c8ff',
  fontSize: 11,
  fontFamily: 'system-ui, sans-serif',
  pointerEvents: 'none',
  userSelect: 'none',
}

/** Minimal heads-up display overlay — goal name, current floor */
export function HUD({ goalName = 'Complete Semester 1', floor }: HUDProps) {
  return (
    <>
      <div style={hudStyle}>
        <div style={{ fontSize: 10, color: '#585450', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
          Ascending
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f0c060' }}>
          {goalName}
        </div>
        <div style={{ fontSize: 11, color: '#807870', marginTop: 2 }}>
          Floor {floor}
        </div>
      </div>
      <div style={badgeStyle}>
        Floor {floor}
      </div>
    </>
  )
}
