<<<<<<< Updated upstream
import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import MountainScene from '../components/MountainScene';
=======
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import FocusCamera from '../components/FocusCamera';
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
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
=======
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, i) => { if (p.alpha <= 0) particles.splice(i, 1); else { p.update(); p.draw(); } });
            requestAnimationFrame(animate);
        };
        animate();
        return () => clearInterval(interval);
    }, []);
    return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 100 }} />;
};

export default function Home({ session, onSignOut, goalName, totalHours, startTasks, isPaused, setIsPaused }: HomeProps) {
    const [timeLeft, setTimeLeft] = useState(totalHours * 3600);
    const [tasks, setTasks] = useState<Task[]>(() =>
        startTasks.map((text, i) => ({ id: `init-${i}-${Date.now()}`, text, completed: false }))
    );

    const progressPercent = tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
    const isFinished = progressPercent === 100 && tasks.length > 0;

    // AI Camera Distraction Handler
    // Automatically triggers the pause state if the user looks away or picks up a phone
    const handleDistraction = useCallback((isDistracted: boolean) => {
        setIsPaused(isDistracted);
    }, [setIsPaused]);

    useEffect(() => {
        // Now using !isPaused to drive the timer
        if (isPaused || timeLeft <= 0 || isFinished) return;
        const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isPaused, timeLeft, isFinished]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const glassStyle: React.CSSProperties = {
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)', color: '#fff', position: 'absolute', zIndex: 10,
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: 'transparent' }}>
            {isFinished && <Fireworks />}

            {/* AI Camera Overlay — bottom-right */}
            {!isFinished && (
                <div 
                    style={{ 
                        position: 'absolute', 
                        bottom: 16, 
                        right: 16, 
                        zIndex: 10,
                        transform: 'scale(0.6)', // Scales the camera down to 60% size
                        transformOrigin: 'bottom right' 
                    }}
                >
                    <FocusCamera onDistractionChange={handleDistraction} />
                </div>
            )}

            {/* Progress UI */}
            <div style={{ ...glassStyle, top: 16, left: '50%', transform: 'translateX(-50%)', width: 380, padding: '16px 20px', textAlign: 'center', border: isFinished ? '1px solid #f0c060' : '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: isFinished ? '#f0c060' : '#fff' }}>{isFinished ? `SUMMIT REACHED` : goalName}</div>
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '12px 0' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: isFinished ? '#64c878' : '#f0c060', transition: 'width 0.4s ease' }} />
                </div>
                {isFinished && <button onClick={() => window.location.href = '/setup'} style={{ background: 'transparent', border: '1px solid #f0c060', color: '#f0c060', cursor: 'pointer' }}>Descend to Base Camp</button>}
            </div>

            {/* Timer */}
            <div style={{ ...glassStyle, top: '50%', left: 24, transform: 'translateY(-50%)', padding: '24px' }}>
                <div style={{ fontSize: 42, fontWeight: 800 }}>{isFinished ? 'DONE' : formatTime(timeLeft)}</div>
            </div>

            {/* Tasks */}
            <div style={{ ...glassStyle, top: '50%', right: 24, transform: 'translateY(-50%)', width: 280, padding: '20px' }}>
                {tasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', gap: 10, opacity: task.completed ? 0.4 : 1, marginBottom: '8px' }}>
                        <input type="checkbox" checked={task.completed} onChange={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))} />
                        <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span>
                    </div>
                ))}
            </div>

            {/* Bottom Controls */}
            <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 12, zIndex: 10 }}>
                {!isFinished && (
                    <button
                        onClick={() => setIsPaused(!isPaused)} 
                        style={{ padding: '8px 22px', borderRadius: 8, background: !isPaused ? 'rgba(255,255,255,0.1)' : 'rgba(100,200,120,0.7)', color: '#fff', cursor: 'pointer', border: 'none' }}
                    >
                        {!isPaused ? '⏸ Pause' : '▶ Resume'}
                    </button>
                )}
                <button onClick={onSignOut} style={{ padding: '8px 22px', borderRadius: 8, background: 'rgba(200,60,60,0.5)', color: '#fff', cursor: 'pointer', border: 'none' }}>Sign Out</button>
            </div>
        </div>
    );
>>>>>>> Stashed changes
}