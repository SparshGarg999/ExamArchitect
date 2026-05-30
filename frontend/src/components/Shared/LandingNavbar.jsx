import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LandingNavbar() {
  const { currentUser } = useAuth();

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4 animate-fade-in">
      <nav className="flex items-center justify-between px-6 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg text-xs">EA</div>
          <span className="text-lg font-bold font-display text-white">Exam<span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">Architect</span></span>
        </Link>
        
        <div className="flex items-center">
          {currentUser ? (
            <Link to="/exam/1" className="px-6 py-2 rounded-full bg-white text-indigo-950 hover:bg-indigo-50 transition-colors text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Dashboard
            </Link>
          ) : (
            <Link to="/login" className="px-6 py-2 rounded-full bg-white text-indigo-950 hover:bg-indigo-50 transition-colors text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Login
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
