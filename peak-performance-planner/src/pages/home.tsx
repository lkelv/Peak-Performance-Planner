import type { Session } from '@supabase/supabase-js';

interface HomeProps {
  session: Session;
  onSignOut: () => void;
}

export default function Home({ session, onSignOut }: HomeProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Peak Performance Planner</h1>
        <p className="text-gray-600 mb-8">Welcome, {session.user.email}!</p>
        <button 
          onClick={onSignOut}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
