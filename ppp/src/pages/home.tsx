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
    onSignOut, goalName, totalHours, startTasks,
    isPaused, setIsPaused,
    onAvatarStateChange, onMilestonesChange, onTimerProgress,
}: HomeProps) {
    const [timeLeft, setTimeLeft] = useState(totalHours * 3600);
    const [tasks, setTasks] = useState<Task[]>(() =>
        startTasks.map((text, i) => ({ id: `init-${i}-${Date.now()}`, text, completed: false }))
    );
    const [newTaskText, setNewTaskText] = useState('');
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showAddTimeModal, setShowAddTimeModal] = useState(false);

    // Time extension inputs
    const [addH, setAddH] = useState(0);
    const [addM, setAddM] = useState(30);

    const audioRef = useRef<HTMLAudioElement | null>(null);

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

    const handleAddTime = useCallback((additionalSeconds: number) => {
        setTimeLeft((prev) => Math.max(prev + additionalSeconds, 0));
    }, [setTimeLeft]);

    // Audio Control logic
    useEffect(() => {
        if (!audioRef.current) return;
        if (!isPaused && !isFinished && !showFinishModal) {
            audioRef.current.play().catch(() => console.log("Audio waiting for user interaction"));
        } else {
            audioRef.current.pause();
        }
    }, [isPaused, isFinished, showFinishModal]);

    // Timer trigger for Finish Modal
    useEffect(() => {
        if (timeLeft <= 0 && !isFinished && !showFinishModal) {
            setShowFinishModal(true);
            setIsPaused(true);
        }
    }, [timeLeft, isFinished, setIsPaused, showFinishModal]);

    // Main Ticking Logic
    useEffect(() => {
        if (isPaused || timeLeft <= 0 || isFinished) return;
        const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isPaused, timeLeft, isFinished]);

    const updateMilestones = useCallback(
        (updated: Milestone[]) => {
            if (typeof onMilestonesChange === 'function') {
                onMilestonesChange(updated);
            }
        },
        [onMilestonesChange]
    );

    const changeAvatarState = useCallback(
        (state: AvatarState) => {
            if (typeof onAvatarStateChange === 'function') {
                onAvatarStateChange(state);
            }
        },
        [onAvatarStateChange]
    );

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

        // 1. Un-pause (in case we're in a post-milestone pause) and start sprinting
        setIsPaused(false);
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

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const glassStyle: React.CSSProperties = {
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(15px)', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)', color: '#fff', position: 'absolute', zIndex: 10,
    };

    const modalOverlayStyle: React.CSSProperties = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: 'transparent' }}>

            <audio ref={audioRef} src="/pppaudioOriginal.mp3" loop preload="auto" />

            {isFinished && <Fireworks />}

            {/* MODAL: Summit Check-in */}
            {showFinishModal && !isFinished && !showAddTimeModal && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...glassStyle, position: 'relative', width: 420, padding: 32, textAlign: 'center', border: '1px solid #f0c060' }}>
                        <h2 style={{ color: '#f0c060', marginBottom: 8, fontSize: 28 }}>Summit Review</h2>
                        <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 24 }}>The clock has stopped. Are the milestones complete?</p>

                        <div style={{ textAlign: 'left', maxHeight: 180, overflowY: 'auto', marginBottom: 24, padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                            {tasks.map(task => (
                                <div key={task.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                    <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} style={{ accentColor: '#f0c060' }} />
                                    <span style={{ fontSize: 14, textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.5 : 1 }}>{task.text}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowAddTimeModal(true)}
                            style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}
                        >
                            ⏳ Need more time? (Extend Ascent)
                        </button>

                        <button
                            onClick={() => { if(isFinished) setShowFinishModal(false); else alert("Please finish your tasks to reach the peak!"); }}
                            style={{ width: '100%', padding: '14px', background: isFinished ? '#f0c060' : '#333', border: 'none', borderRadius: 8, color: '#000', fontWeight: 800, cursor: isFinished ? 'pointer' : 'not-allowed' }}
                        >
                            {isFinished ? "Celebrate Success" : "Complete Milestones"}
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL: Extend Ascent */}
            {showAddTimeModal && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...glassStyle, position: 'relative', width: 350, padding: 32, textAlign: 'center' }}>
                        <h3 style={{ marginBottom: 20 }}>Extend Your Climb</h3>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 10, opacity: 0.5, display: 'block', marginBottom: 4 }}>HOURS</label>
                                <input type="number" min="0" value={addH} onChange={e => setAddH(parseInt(e.target.value) || 0)} style={{ width: '100%', background: '#222', border: '1px solid #444', color: '#fff', padding: 10, borderRadius: 6, textAlign: 'center' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 10, opacity: 0.5, display: 'block', marginBottom: 4 }}>MINS</label>
                                <input type="number" min="0" max="59" value={addM} onChange={e => setAddM(parseInt(e.target.value) || 0)} style={{ width: '100%', background: '#222', border: '1px solid #444', color: '#fff', padding: 10, borderRadius: 6, textAlign: 'center' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setShowAddTimeModal(false)} style={{ flex: 1, padding: 12, background: 'transparent', color: '#999', border: 'none', cursor: 'pointer' }}>Back</button>
                            <button onClick={handleAddTime} style={{ flex: 1, padding: 12, background: '#f0c060', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Branding / Progress */}
            <div style={{ ...glassStyle, top: 16, left: '50%', transform: 'translateX(-50%)', width: 380, padding: '16px 20px', textAlign: 'center', border: isFinished ? '1px solid #f0c060' : '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: isFinished ? '#f0c060' : '#fff' }}>{isFinished ? `SUMMIT REACHED` : goalName}</div>
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '12px 0' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: isFinished ? '#64c878' : '#f0c060', transition: 'width 0.4s ease' }} />
                </div>
                {isFinished && <button onClick={() => window.location.href = '/setup'} style={{ background: 'transparent', border: '1px solid #f0c060', color: '#f0c060', cursor: 'pointer', padding: '4px 12px', borderRadius: 4 }}>New Ascent</button>}
            </div>

            {/* Timer Display */}
            <div style={{ ...glassStyle, top: '50%', left: 24, transform: 'translateY(-50%)', padding: '24px', textAlign: 'center', width: 180 }}>
                <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>REMAINING</div>
                <div style={{ fontSize: 42, fontWeight: 800 }}>{isFinished ? 'DONE' : formatTime(timeLeft)}</div>
            </div>

            {/* Milestones Panel */}
            <div style={{ ...glassStyle, top: '50%', right: 24, transform: 'translateY(-50%)', width: 300, padding: '20px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#f0c060' }}>Milestones</div>
                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {tasks.map(task => (
                        <div key={task.id} style={{ display: 'flex', gap: 10, opacity: task.completed ? 0.4 : 1 }}>
                            <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} style={{ accentColor: '#f0c060' }} />
                            <span style={{ fontSize: 13, textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span>
                        </div>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); if(!newTaskText.trim()) return; setTasks([...tasks, { id: Date.now().toString(), text: newTaskText, completed: false }]); setNewTaskText(''); }} style={{ display: 'flex', gap: 8 }}>
                    <input type="text" placeholder="Add milestone..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 12px', color: '#fff', fontSize: 13 }} />
                    <button type="submit" style={{ background: '#f0c060', border: 'none', borderRadius: 6, color: '#000', padding: '0 12px', fontWeight: 700, cursor: 'pointer' }}>+</button>
                </form>
            </div>

            {/* Controls */}
            <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 12 }}>
                {!isFinished && (
                    <button
                        onClick={() => {
                            const resuming = isPaused;
                            setIsPaused(!isPaused);
                            // When resuming, reset avatar back to walking and hide flags
                            if (resuming) {
                                changeAvatarState('WALKING');
                                // Unrender all reached milestone flags so they disappear
                                const cleared = milestones.map(m =>
                                    m.isReached ? { ...m, isRendered: false } : m
                                );
                                updateMilestones(cleared);
                            }
                        }}
                        style={{ padding: '8px 22px', borderRadius: 8, background: !isPaused ? 'rgba(255,255,255,0.1)' : 'rgba(100,200,120,0.7)', color: '#fff', cursor: 'pointer' }}
                    >
                        {!isPaused ? '⏸ Pause' : '▶ Resume'}
                    </button>
                )}
                <button onClick={onSignOut} style={{ padding: '12px 28px', borderRadius: 12, background: 'rgba(200,60,60,0.45)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Sign Out</button>
            </div>
        </div>
    );
}
