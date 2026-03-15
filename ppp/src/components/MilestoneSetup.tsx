import { useState } from 'react';

interface MilestoneSetupProps {
    onComplete: (tasks: string[]) => void;
    goalName: string;
}

export default function MilestoneSetup({ onComplete, goalName }: MilestoneSetupProps) {
    const [milestones, setMilestones] = useState<string[]>(['']);

    const addField = () => setMilestones([...milestones, '']);

    const updateMilestone = (index: number, value: string) => {
        const newMilestones = [...milestones];
        newMilestones[index] = value;
        setMilestones(newMilestones);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty spaces/strings
        const filtered = milestones.filter(m => m.trim() !== '');

        let finalTasks: string[];

        if (filtered.length === 0) {
            // Case 0: Empty input
            finalTasks = ['Reach the clouds', 'Reach the peak'];
        } else if (filtered.length === 1) {
            // Case 1: User provided exactly one milestone
            // Keep their milestone and append the peak
            finalTasks = [filtered[0], 'Reach the peak'];
        } else {
            // Case 2: User provided 2 or more milestones
            finalTasks = filtered;
        }

        onComplete(finalTasks);
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
        maxWidth: '420px',
        padding: '40px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        color: '#e8e2d9',
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '32px' }}>🚩</div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f0c060', marginTop: '8px' }}>
                        Map Your Route
                    </h1>
                    <p style={{ fontSize: '14px', color: '#807870' }}>
                        Break "{goalName}" into smaller milestones.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', paddingRight: '8px' }}>
                        {milestones.map((m, i) => (
                            <input
                                key={i}
                                type="text"
                                placeholder={`Milestone ${i + 1}`}
                                value={m}
                                onChange={(e) => updateMilestone(i, e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginBottom: '10px',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addField}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: 'transparent',
                            border: '1px dashed rgba(240, 192, 96, 0.4)',
                            borderRadius: '8px',
                            color: '#f0c060',
                            cursor: 'pointer',
                            marginBottom: '20px',
                            fontSize: '13px'
                        }}
                    >
                        + Add Another Step
                    </button>

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
                            cursor: 'pointer'
                        }}
                    >
                        Confirm & Start Climb
                    </button>
                </form>
            </div>
        </div>
    );
}