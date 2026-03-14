import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import LoginPage from './components/LoginPage';
import Home from './pages/home';
import './App.css';

// Initialize Supabase - Ensure you add these to your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not set. Please configure it in your environment (.env).');
}

if (!supabaseKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not set. Please configure it in your environment (.env).');
}

const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (credentials: { email: string; password: string }, isSignUp: boolean) => {
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp(credentials);
        if (error) throw error;
        alert('Signup successful! Check your email to verify if required, or you are now logged in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword(credentials);
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            session ? <Navigate to="/home" replace /> : <LoginPage onAuth={handleAuth} />
          } 
        />
        <Route 
          path="/home" 
          element={
            session ? (
              <Home session={session} onSignOut={() => supabase.auth.signOut()} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        {/* Catch-all route to redirect unknown URLs to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
