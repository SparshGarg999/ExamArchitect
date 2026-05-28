import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, User as UserIcon, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="flex items-center justify-between py-4 px-6 mb-8 border-b border-white/5">
      <Link to="/" className="flex items-center gap-3 no-underline">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg">EA</div>
        <span className="text-xl font-bold font-display text-white">Exam<span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">Architect</span></span>
      </Link>
      
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-indigo-100">GATE CS Module Seeding Active</span>
        </div>

        {currentUser ? (
          <>
            <Link to="/mock-exam" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs md:text-sm font-semibold text-slate-300">
              <BookOpen size={14} className="text-indigo-400" />
              <span className="hidden sm:inline">Mock Exams</span>
              <span className="sm:hidden">Mocks</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-300 ml-2">
              <UserIcon size={16} />
              <span>{currentUser.name}</span>
            </div>
            
            {currentUser.role === 'admin' && (
              <Link to="/internal-admin" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors text-sm font-semibold">
                <ShieldAlert size={16} /> Admin Console
              </Link>
            )}

            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs md:text-sm font-semibold text-slate-300">
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/mock-exam" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs md:text-sm font-semibold text-slate-300 mr-2">
              <BookOpen size={14} className="text-indigo-400" />
              <span className="hidden sm:inline">Mock Exams</span>
              <span className="sm:hidden">Mocks</span>
            </Link>
            <Link to="/login" className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs md:text-sm font-semibold text-white">
              Login
            </Link>
            <Link to="/register" className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 hover:-translate-y-0.5 transition-transform text-xs md:text-sm font-semibold text-white shadow-lg shadow-indigo-500/20">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
