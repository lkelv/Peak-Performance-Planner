import { useState, useEffect, useRef, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AvatarState, Milestone } from '../components/constants';
import {
    SPRINT_DURATION,
    CELEBRATE_DURATION,
    FLAG_ANTICIPATION_SECONDS,
} from '../components/constants';

interface HomeProps {
    session: Session;
    onSignOut: () => void;
    goalName: string;
    totalHours: number;
    startTasks: string[];
    isPaused: boolean;
    setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
    onAvatarStateChange: (state: AvatarState) => void;
    onMilestonesChange: (milestones: Milestone[]) => void;
    onTimerProgress: (progress: number) => void;
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
    session, onSignOut, goalName, totalHours, startTasks,
    isPaused, setIsPaused,
    onAvatarStateChange, onMilestonesChange, onTimerProgress,
}: HomeProps) {
    const [timeLeft, setTimeLeft] = useState(totalHours * 3600);
    const [tasks, setTasks] = useState<Task[]>(() =>
        startTasks.map((text, i) => ({ id: `init-${i}-${Date.now()}`, text, completed: false }))
    );
    const [avatarState, setAvatarState] = useState<AvatarState>('WALKING');
    const [milestones, setMilestones] = useState<Milestone[]>(() =>
        startTasks.map((text, i) => ({
            id: `ms-${i}-${Date.now()}`,
            name: text,
            taskIndex: i,
            progressTarget: (i + 1) / startTasks.length,
            isRendered: false,
            isReached: false,
        }))
    );

    // Track whether we're in a milestone animation sequence
    const animatingRef = useRef(false);
    const totalSeconds = totalHours * 3600;

    const progressPercent = tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
    const isFinished = progressPercent === 100 && tasks.length > 0;

    // Push timer progress to 3D scene (0–1)
    useEffect(() => {
        const progress = 1 - (timeLeft / totalSeconds);
        onTimerProgress(Math.max(0, Math.min(1, progress)));
    }, [timeLeft, totalSeconds, onTimerProgress]);

    // Push avatar state changes
    const changeAvatarState = useCallback((state: AvatarState) => {
        setAvatarState(state);
        onAvatarStateChange(state);
    }, [onAvatarStateChange]);

    // Push milestone changes
    const updateMilestones = useCallback((ms: Milestone[]) => {
        setMilestones(ms);
        onMilestonesChange(ms);
    }, [onMilestonesChange]);

    // Timer tick
    useEffect(() => {
        if (isPaused || timeLeft <= 0 || isFinished || animatingRef.current) return;
        const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isPaused, timeLeft, isFinished]);

    // ── Scenario B: Timer approaching expiry ────────────────────────
    // When timer is within FLAG_ANTICIPATION_SECONDS of 0, render the
    // next unreached milestone flag with a "rise" animation.
    useEffect(() => {
        if (timeLeft <= FLAG_ANTICIPATION_SECONDS && timeLeft > 0) {
            const nextUnreached = milestones.find(m => !m.isReached && !m.isRendered);
            if (nextUnreached) {
                const updated = milestones.map(m =>
                    m.id === nextUnreached.id ? { ...m, isRendered: true } : m
                );
                updateMilestones(updated);
            }
        }
    }, [timeLeft]);

    // ── Scenario B: Timer hits zero ─────────────────────────────────
    useEffect(() => {
        if (timeLeft <= 0 && !isFinished && !animatingRef.current) {
            // Mark next unreached milestone as reached
            const nextUnreached = milestones.find(m => !m.isReached);
            if (nextUnreached) {
                animatingRef.current = true;
                const updated = milestones.map(m =>
                    m.id === nextUnreached.id ? { ...m, isReached: true, isRendered: true } : m
                );
                updateMilestones(updated);
                changeAvatarState('IDLE');

                // Camera pull-back effect (same as pause)
                setIsPaused(true);

                setTimeout(() => {
                    animatingRef.current = false;
                }, (CELEBRATE_DURATION) * 1000);
            }
        }
    }, [timeLeft]);

    // ── Scenario A: Task completed early (checkbox) ─────────────────
    const handleTaskToggle = useCallback((taskId: string) => {
        if (animatingRef.current) return; // Don't allow during animation

        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        setTasks(updatedTasks);

        const toggledTask = updatedTasks.find(t => t.id === taskId);
        if (!toggledTask || !toggledTask.completed) return; // Only trigger on completion, not un-completion

        // Find the milestone for this task
        const taskIdx = tasks.findIndex(t => t.id === taskId);
        const milestone = milestones.find(m => m.taskIndex === taskIdx);
        if (!milestone || milestone.isReached) return;

        // ── Sprint → Flag → Celebrate → Zoom out sequence ──────────
        animatingRef.current = true;

        // 1. Freeze timer, start sprinting
        changeAvatarState('SPRINTING');

        // 2. After sprint duration, spawn flag and celebrate
        setTimeout(() => {
            // Mark milestone as reached and rendered
            const updated = milestones.map(m =>
                m.id === milestone.id ? { ...m, isReached: true, isRendered: true } : m
            );
            updateMilestones(updated);
            changeAvatarState('CELEBRATING');

            // 3. After celebration, switch to idle and zoom out (pause effect)
            setTimeout(() => {
                changeAvatarState('IDLE');
                setIsPaused(true);
                animatingRef.current = false;
            }, CELEBRATE_DURATION * 1000);

        }, SPRINT_DURATION * 1000);

    }, [tasks, milestones, changeAvatarState, updateMilestones, setIsPaused]);

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
                    <div key={task.id} style={{ display: 'flex', gap: 10, opacity: task.completed ? 0.4 : 1 }}>
                        <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleTaskToggle(task.id)}
                            disabled={animatingRef.current}
                        />
                        <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span>
                    </div>
                ))}
            </div>

            {/* Bottom Controls */}
            <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 12 }}>
                {!isFinished && (
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        style={{ padding: '8px 22px', borderRadius: 8, background: !isPaused ? 'rgba(255,255,255,0.1)' : 'rgba(100,200,120,0.7)', color: '#fff', cursor: 'pointer' }}
                    >
                        {!isPaused ? '⏸ Pause' : '▶ Resume'}
                    </button>
                )}
                <button onClick={onSignOut} style={{ padding: '8px 22px', borderRadius: 8, background: 'rgba(200,60,60,0.5)', color: '#fff', cursor: 'pointer' }}>Sign Out</button>
            </div>
        </div>
    );
}
