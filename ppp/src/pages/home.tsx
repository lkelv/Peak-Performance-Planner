import { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';

interface HomeProps {
    session: Session;
    onSignOut: () => void;
    goalName: string;
    totalHours: number;
    startTasks: string[];
    isPaused: boolean;
    setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
    // Called the moment the last subtask checkbox is ticked.
    // App.tsx uses this to set allTasksDone=true, which tells MountainWorld
    // to inject peak.glb on the next section recycle.
    onAllTasksDone: () => void;
    // Set to true by App.tsx once MountainWorld fires onSummitReached —
    // i.e. the avatar has physically walked onto the peak. This is what
    // triggers the fireworks and the "SUMMIT REACHED" banner.
    summitReached: boolean;
}

interface Task {
    id: string;
    text: string;
    completed: boolean;
}

const Fireworks = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const particles: any[] = [];
        const colors = ['#f0c060', '#ffffff', '#ff5555', '#64c878', '#5555ff'];

        class Particle {
            x: number; y: number; color: string; velocity: { x: number; y: number }; alpha: number;
            constructor(x: number, y: number, color: string) {
                this.x = x; this.y = y; this.color = color;
                this.velocity = { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 };
                this.alpha = 1;
            }
            draw() {
                if (!ctx) return;
                ctx.save(); ctx.globalAlpha = this.alpha; ctx.beginPath();
                ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = this.color; ctx.fill(); ctx.restore();
            }
            update() { this.x += this.velocity.x; this.y += this.velocity.y; this.alpha -= 0.01; }
        }

        const interval = setInterval(() => {
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height * 0.5);
            const color = colors[Math.floor(Math.random() * colors.length)];
            for (let i = 0; i < 30; i++) particles.push(new Particle(x, y, color));
        }, 600);

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

export default function Home({
    session,
    onSignOut,
    goalName,
    totalHours,
    startTasks,
    isPaused,
    setIsPaused,
    onAllTasksDone,
    summitReached,
}: HomeProps) {
    const [timeLeft, setTimeLeft] = useState(totalHours * 3600);
    const [tasks, setTasks] = useState<Task[]>(() =>
        startTasks.map((text, i) => ({ id: `init-${i}-${Date.now()}`, text, completed: false }))
    );

    // Ensures onAllTasksDone fires exactly once, not on every re-render.
    const allTasksDoneNotifiedRef = useRef(false);

    const progressPercent = tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
    const isFinished = progressPercent === 100 && tasks.length > 0;

    // The moment all checkboxes are ticked, notify App.tsx so it can set
    // allTasksDone=true → MountainWorld injects peak.glb on next recycle.
    useEffect(() => {
        if (isFinished && !allTasksDoneNotifiedRef.current) {
            allTasksDoneNotifiedRef.current = true;
            onAllTasksDone();
        }
    }, [isFinished, onAllTasksDone]);

    // Fireworks play once the avatar physically arrives at the summit.
    // summitReached is driven by MountainWorld → App.tsx → here.
    const showFireworks = summitReached;

    useEffect(() => {
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

            {showFireworks && <Fireworks />}

            {/* Progress UI */}
            <div style={{
                ...glassStyle,
                top: 16, left: '50%', transform: 'translateX(-50%)', width: 380, padding: '16px 20px', textAlign: 'center',
                border: showFireworks ? '1px solid #f0c060' : '1px solid rgba(255,255,255,0.1)',
            }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: showFireworks ? '#f0c060' : '#fff' }}>
                    {summitReached
                        ? 'SUMMIT REACHED 🏔'
                        : isFinished
                            ? 'TASKS COMPLETE — REACHING SUMMIT…'
                            : goalName}
                </div>
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '12px 0' }}>
                    <div style={{
                        width: `${progressPercent}%`, height: '100%',
                        background: showFireworks ? '#64c878' : '#f0c060',
                        transition: 'width 0.4s ease',
                    }} />
                </div>
                {summitReached && (
                    <button
                        onClick={() => window.location.href = '/setup'}
                        style={{ background: 'transparent', border: '1px solid #f0c060', color: '#f0c060', cursor: 'pointer', padding: '6px 16px', borderRadius: 6 }}
                    >
                        Descend to Base Camp
                    </button>
                )}
            </div>

            {/* Timer */}
            <div style={{ ...glassStyle, top: '50%', left: 24, transform: 'translateY(-50%)', padding: '24px' }}>
                <div style={{ fontSize: 42, fontWeight: 800 }}>
                    {summitReached ? 'DONE' : formatTime(timeLeft)}
                </div>
            </div>

            {/* Tasks */}
            <div style={{ ...glassStyle, top: '50%', right: 24, transform: 'translateY(-50%)', width: 280, padding: '20px' }}>
                {tasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', gap: 10, opacity: task.completed ? 0.4 : 1, marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                        />
                        <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span>
                    </div>
                ))}
            </div>

            {/* Bottom Controls */}
            <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 12 }}>
                {!summitReached && (
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        style={{
                            padding: '8px 22px', borderRadius: 8,
                            background: !isPaused ? 'rgba(255,255,255,0.1)' : 'rgba(100,200,120,0.7)',
                            color: '#fff', cursor: 'pointer', border: 'none',
                        }}
                    >
                        {!isPaused ? '⏸ Pause' : '▶ Resume'}
                    </button>
                )}
                <button
                    onClick={onSignOut}
                    style={{ padding: '8px 22px', borderRadius: 8, background: 'rgba(200,60,60,0.5)', color: '#fff', cursor: 'pointer', border: 'none' }}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}