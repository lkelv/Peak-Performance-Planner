import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import LoginPage from './components/LoginPage';
import GoalSetup from './components/GoalSetup';
import MilestoneSetup from './components/MilestoneSetup';
import Home from './pages/home';
import MountainScene from './components/MountainScene';
import './App.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [mountainGoal, setMountainGoal] = useState<{ name: string; hours: number } | null>(null);
    const [initialTasks, setInitialTasks] = useState<string[] | null>(null);

    // Controls both the timer and the 3D world scroll
    const [isPaused, setIsPaused] = useState(false);

    // True once every subtask checkbox is ticked — tells MountainWorld to
    // inject peak.glb on the next section recycle instead of mountain.glb.
    // Derived from initialTasks length; the actual per-task completion state
    // lives inside <Home>, so we pass a callback down to read it back up.
    const [allTasksDone, setAllTasksDone] = useState(false);

    // True once MountainWorld fires onSummitReached — the avatar has walked
    // PEAK_STOP_AFTER_HALF_REV revolutions on the peak. At that point we
    // pause climbing (stopping the avatar) so the fireworks can play.
    const [summitReached, setSummitReached] = useState(false);

    const handleSummitReached = () => {
        setSummitReached(true);
        setIsPaused(true);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                setMountainGoal(null);
                setInitialTasks(null);
                setAllTasksDone(false);
                setSummitReached(false);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleAuth = async (credentials: { email: string; password: string }, isSignUp: boolean) => {
        try {
            if (isSignUp) {
                await supabase.auth.signUp(credentials);
                alert('Check your email!');
            } else {
                await supabase.auth.signInWithPassword(credentials);
            }
        } catch (error: any) {
            alert(error.message);
        }
    };

    const isInHomeView = !!(session && mountainGoal && initialTasks);

    return (
        <BrowserRouter>
            <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000' }}>

                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <MountainScene
                        height={window.innerHeight}
                        isClimbing={isInHomeView && !isPaused}
                        viewMode={isInHomeView ? 'close' : 'wide'}
                        allTasksDone={allTasksDone}
                        onSummitReached={handleSummitReached}
                    />
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <Routes>
                        <Route path="/" element={
                            session ? <Navigate to="/setup" replace /> : <LoginPage onAuth={handleAuth} />
                        } />

                        <Route path="/setup" element={
                            session ? (
                                mountainGoal ? <Navigate to="/milestones" replace /> : <GoalSetup onComplete={(n, h) => setMountainGoal({ name: n, hours: h })} />
                            ) : <Navigate to="/" replace />
                        } />

                        <Route path="/milestones" element={
                            session ? (
                                initialTasks ? <Navigate to="/home" replace /> :
                                    <MilestoneSetup goalName={mountainGoal?.name || ''} onComplete={setInitialTasks} />
                            ) : <Navigate to="/" replace />
                        } />

                        <Route path="/home" element={
                            session && mountainGoal && initialTasks ? (
                                <Home
                                    session={session}
                                    onSignOut={() => supabase.auth.signOut()}
                                    goalName={mountainGoal.name}
                                    totalHours={mountainGoal.hours}
                                    startTasks={initialTasks}
                                    isPaused={isPaused}
                                    setIsPaused={setIsPaused}
                                    onAllTasksDone={() => setAllTasksDone(true)}
                                    summitReached={summitReached}
                                />
                            ) : <Navigate to="/" replace />
                        } />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;