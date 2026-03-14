import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import LoginPage from './components/LoginPage';
import GoalSetup from './components/GoalSetup';
import Home from './pages/home';
import './App.css';

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are missing. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [session, setSession] = useState<Session | null>(null);

  // State to hold the mountain goal data from the setup page
  const [mountainGoal, setMountainGoal] = useState<{ name: string; hours: number } | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // If user logs out, clear the mountain goal to reset the flow
      if (!session) setMountainGoal(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (credentials: { email: string; password: string }, isSignUp: boolean) => {
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp(credentials);
        if (error) throw error;
        alert('Signup successful! Check your email to verify if required.');
      } else {
        const { error } = await supabase.auth.signInWithPassword(credentials);
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Callback for when the setup page is completed
  const handleSetupComplete = (name: string, hours: number) => {
    setMountainGoal({ name, hours });
  };

  return (
      <BrowserRouter>
        <Routes>
          {/* Step 1: Login Gate */}
          <Route
              path="/"
              element={
                session ? <Navigate to="/setup" replace /> : <LoginPage onAuth={handleAuth} />
              }
          />

          {/* Step 2: Goal Setup (The In-between Page) */}
          <Route
              path="/setup"
              element={
                session ? (
                    mountainGoal ? (
                        <Navigate to="/home" replace />
                    ) : (
                        <GoalSetup onComplete={handleSetupComplete} />
                    )
                ) : (
                    <Navigate to="/" replace />
                )
              }
          />

          {/* Step 3: Home (The Mountain Climb) */}
          <Route
              path="/home"
              element={
                session ? (
                    mountainGoal ? (
                        <Home
                            session={session}
                            onSignOut={() => supabase.auth.signOut()}
                            goalName={mountainGoal.name}
                            totalHours={mountainGoal.hours}
                        />
                    ) : (
                        <Navigate to="/setup" replace />
                    )
                ) : (
                    <Navigate to="/" replace />
                )
              }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;