import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import LoginPage from './components/LoginPage';
import Home from './pages/home';
import './App.css';

// Initialize Supabase - Ensure you add these to your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
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

  // Render the main application once a user is authenticated
  if (session) {
    return <Home session={session} onSignOut={() => supabase.auth.signOut()} />;
  }

  return <LoginPage onAuth={handleAuth} />;
}

export default App;
