import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Shared/Navbar';
import ToastContainer from './components/Shared/ToastContainer';
import ProtectedRoute from './components/Shared/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import MockExam from './pages/MockExam';
import PrivacyPolicy from './pages/PrivacyPolicy';

export default function App() {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  
  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div className="min-h-screen text-slate-100 font-body relative overflow-x-hidden bg-[#0a0b10]">
      <Navbar />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      <main className="pb-20">
        <Routes>
          <Route path="/" element={<Home addToast={addToast} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/mock-exam" element={<MockExam addToast={addToast} />} />
          
          <Route path="/exam/:id" element={<Dashboard addToast={addToast} />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route path="/internal-admin" element={<Admin addToast={addToast} />} />
          </Route>
          
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </main>
      
      <footer className="border-t border-white/5 py-6 mt-auto text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} ExamArchitect</span>
          <a href="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
