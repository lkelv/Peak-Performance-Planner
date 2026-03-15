import { useState } from 'react';

interface GoalSetupProps {
    onComplete: (goalName: string, totalHours: number) => void;
}

export default function GoalSetup({ onComplete }: GoalSetupProps) {
    const [goalName, setGoalName] = useState('');
    const [hours, setHours] = useState<number>(1);
    const [minutes, setMinutes] = useState<number>(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!goalName.trim()) return;

        // Convert hours + minutes into a total decimal hour value
        // Example: 1h 30m -> 1 + (30/60) = 1.5 hours
        const totalDecimalHours = hours + (minutes / 60);

        // Ensure the total is at least 1 minute (0.016 hours) and not over 1000
        const validatedTime = Math.min(Math.max(totalDecimalHours, 0.016), 1000);

        onComplete(goalName, validatedTime);
    };

    const containerStyle: React.CSSProperties = {
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        fontFamily: 'system-ui, sans-serif',
    };

    const cardStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        textAlign: 'center',
        color: '#e8e2d9',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        margin: '12px 0 24px 0',
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '15px',
        outline: 'none',
        boxSizing: 'border-box',
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏔</div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#f0c060' }}>
                    Define Your Peak
                </h1>
                <p style={{ fontSize: '14px', color: '#807870', marginBottom: '32px' }}>
                    What is the main goal of this ascent?
                </p>

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>
                        Mountain Name
                    </label>
                    <input
                        required
                        type="text"
                        placeholder="e.g. Complete Semester 1"
                        value={goalName}
                        onChange={(e) => setGoalName(e.target.value)}
                        style={inputStyle}
                    />

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>
                                Hours
                            </label>
                            <input
                                required
                                type="number"
                                min="0"
                                max="1000"
                                value={hours}
                                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>
                                Minutes
                            </label>
                            <input
                                required
                                type="number"
                                min="0"
                                max="59"
                                value={minutes}
                                onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: '#f0c060',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#1a1a1a',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                            marginTop: '8px',
                            transition: 'background 0.2s, transform 0.1s',
                        }}
                    >
                        Begin Ascent
                    </button>
                </form>
            </div>
        </div>
    );
}