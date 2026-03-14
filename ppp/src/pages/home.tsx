import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import MountainScene from '../components/MountainScene';

interface HomeProps {
    session: Session;
    onSignOut: () => void;
}

interface Task {
    id: string;
    text: string;
    completed: boolean;
}

export default function Home({ session, onSignOut }: HomeProps) {
    const [isClimbing, setIsClimbing] = useState(true);

    // --- Timer State ---
    const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes

    // --- Task State ---
    const [tasks, setTasks] = useState<Task[]>([
        { id: '1', text: 'Set up BlackMagic repo', completed: true },
        { id: '2', text: 'Finish React components', completed: false },
        { id: '3', text: 'Review Web Dev notes', completed: false },
    ]);
    const [newTaskText, setNewTaskText] = useState('');

    // --- Timer Logic ---
    useEffect(() => {
        if (!isClimbing || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isClimbing, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // --- Task Logic ---
    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        setTasks([...tasks, { id: Date.now().toString(), text: newTaskText, completed: false }]);
        setNewTaskText('');
    };

    // --- Progress Logic ---
    const completedTasks = tasks.filter(t => t.completed).length;
    const progressPercent = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

    // --- Common Glass Panel Style ---
    const glassPanelStyle: React.CSSProperties = {
        background: 'rgba(6,8,18,0.72)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 12,
        color: '#e8e2d9',
        fontFamily: 'system-ui, sans-serif',
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* Full-viewport 3D mountain — the background IS the mountain */}
            <MountainScene height={window.innerHeight} isClimbing={isClimbing} />

            {/* TOP: Progress Bar & Mountain Title */}
            <div
                style={{
                    ...glassPanelStyle,
                    position: 'absolute',
                    top: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 400,
                    padding: '16px 24px',
                    textAlign: 'center',
                }}
            >
                <div style={{ fontSize: 12, color: '#585450', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    Ascending
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f0c060', marginBottom: 12 }}>
                    Complete Semester 1
                </div>
                {/* Progress Bar Track */}
                <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    {/* Progress Bar Fill */}
                    <div
                        style={{
                            width: `${progressPercent}%`,
                            height: '100%',
                            background: '#f0c060',
                            transition: 'width 0.4s ease-out'
                        }}
                    />
                </div>
                <div style={{ fontSize: 11, color: '#807870', marginTop: 8 }}>
                    {progressPercent}% Completed ({completedTasks}/{tasks.length} tasks)
                </div>
            </div>

            {/* LEFT: Timer */}
            <div
                style={{
                    ...glassPanelStyle,
                    position: 'absolute',
                    top: '50%',
                    left: 24,
                    transform: 'translateY(-50%)',
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                }}
            >
                <div style={{ fontSize: 14, color: '#807870', letterSpacing: '0.05em' }}>SESSION TIMER</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(timeLeft)}
                </div>
                <button
                    onClick={() => setIsClimbing(c => !c)}
                    style={{
                        padding: '10px 28px',
                        borderRadius: 8,
                        border: 'none',
                        background: isClimbing ? 'rgba(255,255,255,0.18)' : 'rgba(100,200,120,0.7)',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                >
                    {isClimbing ? '⏸ Pause' : '▶ Climb'}
                </button>
            </div>

            {/* RIGHT: Tasks List */}
            <div
                style={{
                    ...glassPanelStyle,
                    position: 'absolute',
                    top: '50%',
                    right: 24,
                    transform: 'translateY(-50%)',
                    width: 320,
                    padding: '20px',
                    maxHeight: '70vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f0c060', marginBottom: 16 }}>
                    Current Tasks
                </div>

                {/* Task List */}
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tasks.map(task => (
                        <label
                            key={task.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                cursor: 'pointer',
                                opacity: task.completed ? 0.6 : 1,
                                transition: 'opacity 0.2s'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleTask(task.id)}
                                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#f0c060' }}
                            />
                            <span style={{
                                fontSize: 14,
                                textDecoration: task.completed ? 'line-through' : 'none',
                                color: task.completed ? '#807870' : '#e8e2d9'
                            }}>
                {task.text}
              </span>
                        </label>
                    ))}
                    {tasks.length === 0 && (
                        <div style={{ fontSize: 13, color: '#807870', textAlign: 'center', padding: '10px 0' }}>
                            No tasks yet. Add one below!
                        </div>
                    )}
                </div>

                {/* Add Task Form */}
                <form onSubmit={addTask} style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="Add new task..."
                        style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 6,
                            padding: '8px 12px',
                            color: '#fff',
                            fontSize: 13,
                            outline: 'none',
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: 'rgba(100,200,120,0.6)',
                            border: 'none',
                            borderRadius: 6,
                            padding: '0 12px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        +
                    </button>
                </form>
            </div>

            {/* BOTTOM CENTER: Sign out & User Info */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                }}
            >
                <div style={{ ...glassPanelStyle, padding: '6px 14px', fontSize: 13, display: 'flex', gap: 8 }}>
                    <span style={{ opacity: 0.7 }}>⛰</span>
                    <span style={{ opacity: 0.85 }}>{session.user.email}</span>
                </div>
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
                        transition: 'background 0.2s',
                    }}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}