import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import MountainScene from '../components/MountainScene';

interface HomeProps {
    session: Session;
    onSignOut: () => void;
    goalName: string;
    totalHours: number;
}

interface Task {
    id: string;
    text: string;
    completed: boolean;
}

export default function Home({ session, onSignOut, goalName, totalHours }: HomeProps) {
    const [isClimbing, setIsClimbing] = useState(true);

    // Timer State (Starting at 25:00)
    const [timeLeft, setTimeLeft] = useState(25 * 60);

    // Task State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskText, setNewTaskText] = useState('');

    // Timer Logic: Syncs with isClimbing
    useEffect(() => {
        if (!isClimbing || timeLeft <= 0) return;
        const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isClimbing, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        setTasks([...tasks, { id: Date.now().toString(), text: newTaskText, completed: false }]);
        setNewTaskText('');
    };

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const progressPercent = tasks.length === 0
        ? 0
        : Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);

    // Shared Glass Style for consistency
    const glassStyle: React.CSSProperties = {
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(8px)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        position: 'absolute',
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
            <MountainScene height={window.innerHeight} isClimbing={isClimbing} />

            {/* TOP: Goal Progress Bar */}
            <div style={{ ...glassStyle, top: 16, left: '50%', transform: 'translateX(-50%)', width: 380, padding: '12px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Goal: {totalHours} Hours</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0c060', marginBottom: 10 }}>{goalName}</div>
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#f0c060', transition: 'width 0.4s ease' }} />
                </div>
            </div>

            {/* LEFT: Timer Panel */}
            <div style={{ ...glassStyle, top: '50%', left: 24, transform: 'translateY(-50%)', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>SESSION</div>
                <div style={{ fontSize: 42, fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>{formatTime(timeLeft)}</div>
                <div style={{ fontSize: 12, color: isClimbing ? '#64c878' : '#807870' }}>{isClimbing ? 'Climbing...' : 'Paused'}</div>
            </div>

            {/* RIGHT: Tasks Panel */}
            <div style={{ ...glassStyle, top: '50%', right: 24, transform: 'translateY(-50%)', width: 280, padding: '20px', maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#f0c060' }}>Tasks</div>
                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {tasks.map(task => (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: task.completed ? 0.4 : 1 }}>
                            <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} style={{ accentColor: '#f0c060' }} />
                            <span style={{ fontSize: 13, textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span>
                        </div>
                    ))}
                </div>
                <form onSubmit={addTask} style={{ display: 'flex', gap: 6 }}>
                    <input
                        type="text"
                        placeholder="Next step..."
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '6px 10px', color: '#fff', fontSize: 12, outline: 'none' }}
                    />
                    <button type="submit" style={{ background: '#f0c060', border: 'none', borderRadius: 4, padding: '0 10px', cursor: 'pointer', fontWeight: 700 }}>+</button>
                </form>
            </div>

            {/* BOTTOM-LEFT: User Info (Minimalist) */}
            <div style={{ ...glassStyle, bottom: 28, left: 16, padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ opacity: 0.6 }}>⛰</span>
                <span style={{ opacity: 0.8 }}>{session.user.email}</span>
            </div>

            {/* BOTTOM-CENTER: Controls */}
            <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 12 }}>
                <button
                    onClick={() => setIsClimbing(c => !c)}
                    style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: isClimbing ? 'rgba(255,255,255,0.18)' : 'rgba(100,200,120,0.7)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                    {isClimbing ? '⏸ Pause' : '▶ Climb'}
                </button>
                <button
                    onClick={onSignOut}
                    style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: 'rgba(200,60,60,0.55)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}