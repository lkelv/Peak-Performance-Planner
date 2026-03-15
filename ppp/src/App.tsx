import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import LoginPage from './pages/LoginPage';
import GoalSetup from './components/GoalSetup';
import MilestoneSetup from './components/MilestoneSetup';
import Home from './pages/home';
import MountainScene from './components/MountainScene';
import type { AvatarState, Milestone } from './components/constants';
import './App.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [mountainGoal, setMountainGoal] = useState<{ name: string; hours: number } | null>(null);
    const [initialTasks, setInitialTasks] = useState<string[] | null>(null);

    // Lifted State: Controls both the timer and the 3D world scroll
    const [isPaused, setIsPaused] = useState(false);

    // Milestone flags state — shared between Home (2D UI) and MountainScene (3D)
    const [avatarState, setAvatarState] = useState<AvatarState>('WALKING');
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [timerProgress, setTimerProgress] = useState(0);

    // ── Peak / summit state (from add-peak-v3) ──────────────────────
    // True once every subtask checkbox is ticked — tells MountainWorld to
    // inject peak.glb on the next section recycle instead of mountain.glb.
    const [allTasksDone, setAllTasksDone] = useState(false);

    // True once MountainWorld fires onSummitReached — the avatar has walked
    // PEAK_STOP_AFTER_HALF_REV revolutions on the peak. At that point we
    // pause climbing so the fireworks can play.
    const [summitReached, setSummitReached] = useState(false);

    const handleSummitReached = useCallback(() => {
        setSummitReached(true);
        setIsPaused(true);
        setAvatarState('IDLE');
    }, []);

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

    const handleAvatarStateChange = useCallback((state: AvatarState) => {
        setAvatarState(state);
    }, []);

    const handleMilestonesChange = useCallback((ms: Milestone[]) => {
        setMilestones(ms);
    }, []);

    const handleTimerProgress = useCallback((progress: number) => {
        setTimerProgress(progress);
    }, []);

    const handleAllTasksDone = useCallback(() => {
        setAllTasksDone(true);
    }, []);

    const isInHomeView = !!(session && mountainGoal && initialTasks);

    // Determine climbing state: climbing when in home view, not paused,
    // and not in a celebration/idle milestone animation.
    // ALSO keep climbing when allTasksDone is true but summit not yet reached
    // (avatar needs to walk up the peak).
    const isSprinting = avatarState === 'SPRINTING';
    const isClimbing = isInHomeView && !isPaused && (
        avatarState === 'WALKING' ||
        avatarState === 'SPRINTING' ||
        // Keep climbing on the peak even after avatar state goes idle from
        // the final task celebration — the summit walk must continue
        (allTasksDone && !summitReached)
    );

    return (
        <BrowserRouter>
            <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000' }}>

                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <MountainScene
                        height={window.innerHeight}
                        isClimbing={isClimbing}
                        isSprinting={isSprinting}
                        viewMode={isInHomeView ? 'close' : 'wide'}
                        avatarState={avatarState}
                        milestones={milestones}
                        timerProgress={timerProgress}
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
                                mountainGoal ? <Navigate to="/milestones" replace /> : <GoalSetup onComplete={(n, h) => setMountainGoal({name: n, hours: h})} />
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
                                    onAvatarStateChange={handleAvatarStateChange}
                                    onMilestonesChange={handleMilestonesChange}
                                    onTimerProgress={handleTimerProgress}
                                    onAllTasksDone={handleAllTasksDone}
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
