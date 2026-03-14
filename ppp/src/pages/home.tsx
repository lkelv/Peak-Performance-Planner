import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import MountainScene from '../components/MountainScene';

interface HomeProps {
  session: Session;
  onSignOut: () => void;
}

export default function Home({ session, onSignOut }: HomeProps) {
  const [isClimbing, setIsClimbing] = useState(true);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Full-viewport 3D mountain — the home page IS the mountain */}
      <MountainScene height={window.innerHeight} isClimbing={isClimbing} />

      {/* Minimal HUD overlay — top-left user info */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(6px)',
          borderRadius: 10,
          padding: '6px 14px',
          color: '#fff',
          fontSize: 13,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: 0.3,
        }}
      >
        <span style={{ opacity: 0.7 }}>⛰</span>
        <span style={{ opacity: 0.85 }}>{session.user.email}</span>
      </div>

      {/* Minimal controls — bottom-center */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <button
          onClick={() => setIsClimbing(c => !c)}
          style={{
            padding: '8px 22px',
            borderRadius: 8,
            border: 'none',
            background: isClimbing ? 'rgba(255,255,255,0.18)' : 'rgba(100,200,120,0.7)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: 0.4,
            transition: 'background 0.2s',
          }}
        >
          {isClimbing ? '⏸ Pause' : '▶ Climb'}
        </button>

        <button
          onClick={onSignOut}
          style={{
            padding: '8px 22px',
            borderRadius: 8,
            border: 'none',
            background: 'rgba(200,60,60,0.55)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: 0.4,
            transition: 'background 0.2s',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}