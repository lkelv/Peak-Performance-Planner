import React, { useState } from 'react';

interface LoginPageProps {
    onAuth?: (credentials: { email: string; password: string }, isSignUp: boolean) => void;
}

export default function LoginPage({ onAuth }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (onAuth) {
            onAuth({ email, password }, isSignUp);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent', // Let the mountain show through
            padding: '2rem 1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            {/* Title */}
            <h1 style={{
                color: '#e8e2d8',
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight: '400',
                marginBottom: '0.5rem',
                textAlign: 'center',
                letterSpacing: '-0.02em',
                lineHeight: '1.2',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)' // Added text shadow for visibility against 3D scene
            }}>
                Peak Performance Planner.
            </h1>
            <p style={{
                color: '#c8c3b8',
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                marginBottom: '2.5rem',
                textAlign: 'center',
                fontWeight: '300',
                textShadow: '0 1px 5px rgba(0,0,0,0.8)'
            }}>
                {isSignUp ? 'Create your Account.' : 'Your Journey Begins.'}
            </p>

            {/* Card with decorative border and glassmorphism */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
                <div style={{
                    border: '1px solid rgba(107, 84, 32, 0.6)',
                    borderRadius: '2px',
                    padding: '2.5rem',
                    backgroundColor: 'rgba(13, 14, 20, 0.65)', // Semi-transparent
                    backdropFilter: 'blur(12px)', // Glass effect
                    position: 'relative',
                }}>
                    {/* Corner accents */}
                    <div style={{ position: 'absolute', top: -2, left: -2, width: '24px', height: '24px', borderTop: '2px solid #c9a44a', borderLeft: '2px solid #c9a44a' }} />
                    <div style={{ position: 'absolute', top: -2, right: -2, width: '24px', height: '24px', borderTop: '2px solid #c9a44a', borderRight: '2px solid #c9a44a' }} />
                    <div style={{ position: 'absolute', bottom: -2, left: -2, width: '24px', height: '24px', borderBottom: '2px solid #c9a44a', borderLeft: '2px solid #c9a44a' }} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: '24px', height: '24px', borderBottom: '2px solid #c9a44a', borderRight: '2px solid #c9a44a' }} />

                    {/* Top center notch */}
                    <div style={{
                        position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                        width: '48px', height: '12px',
                        backgroundColor: 'transparent',
                        borderTop: '1px solid transparent',
                        borderLeft: '1px solid rgba(107, 84, 32, 0.6)',
                        borderRight: '1px solid rgba(107, 84, 32, 0.6)',
                    }} />

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            style={{
                                width: '100%', padding: '0.875rem 1.25rem', backgroundColor: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px',
                                color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
                            }}
                        />

                        <div>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                style={{
                                    width: '100%', padding: '0.875rem 1.25rem', backgroundColor: 'rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px',
                                    color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                            {!isSignUp && (
                                <div style={{ textAlign: 'right', marginTop: '0.625rem' }}>
                                    <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#c9a44a', fontSize: '0.875rem', textDecoration: 'underline' }}>
                                        Forgot Password?
                                    </a>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            style={{
                                width: '100%', padding: '1rem',
                                background: 'linear-gradient(135deg, rgba(28, 74, 71, 0.9) 0%, rgba(42, 99, 96, 0.9) 50%, rgba(28, 74, 71, 0.9) 100%)',
                                border: '1px solid #c9a44a', borderRadius: '999px', color: '#ffffff',
                                fontSize: '1rem', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.03em',
                                marginTop: '0.25rem', transition: 'opacity 0.2s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                            {isSignUp ? 'Create your Account' : 'Begin your Ascent'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '1.75rem', color: '#c8c3b8', fontSize: '0.9375rem' }}>
                        {isSignUp ? (
                            <>Already on the journey? <button onClick={() => setIsSignUp(false)} style={{ background: 'none', border: 'none', color: '#c9a44a', cursor: 'pointer', textDecoration: 'underline' }}>Sign in instead</button>.</>
                        ) : (
                            <>New to the journey? <button onClick={() => setIsSignUp(true)} style={{ background: 'none', border: 'none', color: '#c9a44a', cursor: 'pointer', textDecoration: 'underline' }}>Create your account</button>.</>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}