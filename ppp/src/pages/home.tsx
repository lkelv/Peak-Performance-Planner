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

    // Timer State (Starts at 25m)
    const [timeLeft, setTimeLeft] = useState(25 * 60);

    // Task State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskText, setNewTaskText] = useState('');

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

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        setTasks([...tasks, { id: Date.now().toString(), text: newTaskText, completed: false }]);
        setNewTaskText('');
    };

    const completedTasks = tasks.filter(t => t.completed).length;
    const progressPercent = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

    const glassPanelStyle: React.CSSProperties = {
        background: 'rgba(6,8,18,0.72)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 12,
        color: '#e8e2d9',
        fontFamily: 'system-ui, sans-serif',
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
            <MountainScene height={window.innerHeight} isClimbing={isClimbing} />

            {/* TOP: Progress Bar & Dynamic Mountain Title */}
            <div style={{ ...glassPanelStyle, position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', width: 420, padding: '16px 24px', textAlign: 'center', zIndex: 10 }}>
                <div style={{ fontSize: 10, color: '#585450', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>Current Ascent</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f0c060', marginBottom: 12 }}>{goalName}</div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#f0c060', transition: 'width 0.5s ease-in-out' }} />
                </div>
                <div style={{ fontSize: 11, color: '#807870', marginTop: 8 }}>
                    {totalHours} Hour Goal • {progressPercent}% Progress
                </div>
            </div>

            {/* LEFT: Session Timer */}
            <div style={{ ...glassPanelStyle, position: 'absolute', top: '50%', left: 30, transform: 'translateY(-50%)', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, zIndex: 10 }}>
                <div style={{ fontSize: 12, color: '#807870', letterSpacing: '0.1em' }}>SESSION</div>
                <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</div>
                <button
                    onClick={() => setIsClimbing(c => !c)}
                    style={{ padding: '10px 30px', borderRadius: 8, border: 'none', background: isClimbing ? 'rgba(255,255,255,0.15)' : 'rgba(100,200,120,0.7)', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
                >
                    {isClimbing ? '⏸ Pause' : '▶ Climb'}
                </button>
            </div>

            {/* RIGHT: Tasks List */}
            <div style={{ ...glassPanelStyle, position: 'absolute', top: '50%', right: 30, transform: 'translateY(-50%)', width: 320, padding: '24px', maxHeight: '60vh', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0c060', marginBottom: 18 }}>Milestones</div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {tasks.map(task => (
                        <label key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', opacity: task.completed ? 0.5 : 1 }}>
                            <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} style={{ accentColor: '#f0c060', width: 17, height: 17 }} />
                            <span style={{ fontSize: 14, textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span>
                        </label>
                    ))}
                </div>
                <form onSubmit={addTask} style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="Add a step..."
                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                    />
                    <button type="submit" style={{ background: 'rgba(240,192,96,0.8)', border: 'none', borderRadius: 6, padding: '0 15px', color: '#000', fontWeight: 700, cursor: 'pointer' }}>+</button>
                </form>
            </div>

            {/* BOTTOM: Footer info */}
            <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 15, zIndex: 10 }}>
                <div style={{ ...glassPanelStyle, padding: '8px 16px', fontSize: 13, opacity: 0.9 }}>
                    <span style={{ color: '#f0c060', marginRight: 8 }}>👤</span>
                    {session.user.email}
                </div>
                <button onClick={onSignOut} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'rgba(200,60,60,0.4)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                    Sign Out
                </button>
            </div>
        </div>
    );
}