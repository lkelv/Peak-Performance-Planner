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
      backgroundColor: '#0a0b10',
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
      }}>
        Peak Performance Planner.
      </h1>
      <p style={{
        color: '#6b7280',
        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
        marginBottom: '2.5rem',
        textAlign: 'center',
        fontWeight: '300',
      }}>
        {isSignUp ? 'Create your Account.' : 'Your Journey Begins.'}
      </p>

      {/* Card with decorative border */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '520px',
      }}>
        <div style={{
          border: '1px solid #6b5420',
          borderRadius: '2px',
          padding: '2.5rem',
          backgroundColor: '#0d0e14',
          position: 'relative',
        }}>
          {/* Corner accent — Top Left */}
          <div style={{
            position: 'absolute', top: -2, left: -2,
            width: '24px', height: '24px',
            borderTop: '2px solid #c9a44a',
            borderLeft: '2px solid #c9a44a',
          }} />
          {/* Corner accent — Top Right */}
          <div style={{
            position: 'absolute', top: -2, right: -2,
            width: '24px', height: '24px',
            borderTop: '2px solid #c9a44a',
            borderRight: '2px solid #c9a44a',
          }} />
          {/* Corner accent — Bottom Left */}
          <div style={{
            position: 'absolute', bottom: -2, left: -2,
            width: '24px', height: '24px',
            borderBottom: '2px solid #c9a44a',
            borderLeft: '2px solid #c9a44a',
          }} />
          {/* Corner accent — Bottom Right */}
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: '24px', height: '24px',
            borderBottom: '2px solid #c9a44a',
            borderRight: '2px solid #c9a44a',
          }} />
          {/* Top center notch */}
          <div style={{
            position: 'absolute', top: -1, left: '50%',
            transform: 'translateX(-50%)',
            width: '48px', height: '12px',
            backgroundColor: '#0d0e14',
            borderLeft: '1px solid #6b5420',
            borderRight: '1px solid #6b5420',
          }} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email */}
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              style={{
                width: '100%',
                padding: '0.875rem 1.25rem',
                backgroundColor: '#131419',
                border: '1px solid #2e2916',
                borderRadius: '999px',
                color: '#c8c3b8',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />

            {/* Password + Forgot Password */}
            <div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '0.875rem 1.25rem',
                  backgroundColor: '#131419',
                  border: '1px solid #2e2916',
                  borderRadius: '999px',
                  color: '#c8c3b8',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              {!isSignUp && (
                <div style={{ textAlign: 'right', marginTop: '0.625rem' }}>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{
                      color: '#c9a44a',
                      fontSize: '0.875rem',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #1c4a47 0%, #2a6360 50%, #1c4a47 100%)',
                border: '1px solid #c9a44a',
                borderRadius: '999px',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '0.03em',
                marginTop: '0.25rem',
                fontFamily: 'inherit',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {isSignUp ? 'Create your Account' : 'Begin your Ascent'}
            </button>
          </form>

          {/* Toggle sign-in / sign-up */}
          <div style={{
            textAlign: 'center',
            marginTop: '1.75rem',
            color: '#9ca3af',
            fontSize: '0.9375rem',
          }}>
            {isSignUp ? (
              <>
                Already on the journey?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c9a44a',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                    fontSize: '0.9375rem',
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  Sign in instead
                </button>
                .
              </>
            ) : (
              <>
                New to the journey?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c9a44a',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                    fontSize: '0.9375rem',
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  Create your account
                </button>
                .
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
