import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Cpu, HelpCircle, ArrowRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Shared/Navbar';
import GithubGlobe from '../components/GithubGlobe';

import { API_BASE } from '../config';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
      })
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Could not connect to the API. Make sure the FastAPI backend is running on port 8000!');
        setLoading(false);
      });
  }, []);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setLoading(true);
    fetch(`${API_BASE}/api/exams?category_id=${cat.id}`)
      .then(res => res.json())
      .then(data => {
        setExams(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch exams');
        setLoading(false);
      });
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setExams([]);
  };

  const handleSelectExam = (exam) => {
    navigate(`/exam/${exam.id}`);
  };

  if (loading && categories.length === 0) {
    return (
      <div className="container mx-auto px-4 flex justify-center items-center h-[80vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Analyzing Architectures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      {error && (
        <div className="glass-panel p-4 mb-6 border-rose-500/50 flex gap-3 items-center">
          <AlertTriangle className="text-rose-500" />
          <p className="text-slate-200 text-sm">{error}</p>
        </div>
      )}

      {!selectedCategory ? (
        <>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16 mt-8">
            {/* Desktop Layout */}
            <div className="hidden lg:block flex-1 text-left">
              <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 leading-tight">
                Statistical Exam Analytics <br />
                <span className="text-gradient">Engineered to Predict.</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mb-8 leading-relaxed">
                We analyze decadal examination papers using a mathematical regression engine combined with taxonomy classifications to engineer your ultimate path to the 100th percentile.
              </p>
              <div className="flex flex-wrap gap-8">
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-extrabold font-display bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">10+</span>
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Years Tracked</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-extrabold font-display bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">94.2%</span>
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Prediction Accuracy</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-extrabold font-display bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">1,350+</span>
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">GATE Questions</span>
                </div>
              </div>
            </div>

            {/* Mobile Layout (Globe small and on the right of the hero text) */}
            <div className="flex lg:hidden flex-col gap-4 w-full">
              <div className="flex flex-row items-center gap-4 justify-between">
                <div className="flex-grow text-left">
                  <h1 className="text-3xl font-display font-bold leading-tight">
                    Statistical Exam <br /> Analytics <br />
                    <span className="text-gradient">Engineered to Predict.</span>
                  </h1>
                </div>
                <div className="flex-shrink-0">
                  <GithubGlobe width={130} height={130} />
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mt-2 text-left">
                We analyze decadal examination papers using a mathematical regression engine combined with taxonomy classifications to engineer your ultimate path to the 100th percentile.
              </p>
              <div className="flex flex-wrap gap-6 mt-2 justify-start">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold font-display bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">10+</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Years Tracked</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold font-display bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">94.2%</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Accuracy</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold font-display bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">1,350+</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Questions</span>
                </div>
              </div>
            </div>

            {/* Desktop Globe */}
            <div className="hidden lg:flex flex-shrink-0 justify-center">
              <GithubGlobe width={380} height={380} />
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-6">
              <Layers className="text-indigo-500" size={20} /> Choose Your Discipline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="glass-card p-6 flex flex-col h-full" onClick={() => handleSelectCategory(cat)}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                    <Cpu size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{cat.name}</h3>
                  <p className="text-slate-400 text-sm mb-6 flex-grow">{cat.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                    <span className="text-xs font-semibold text-slate-300">{cat.exam_count} {cat.exam_count === 1 ? 'Exam' : 'Exams'} Available</span>
                    <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">Browse <ArrowRight size={14} /></span>
                  </div>
                </div>
              ))}
              
              <div className="glass-card p-6 flex flex-col h-full opacity-50 cursor-not-allowed border-dashed border-white/10">
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 text-slate-500">
                  <HelpCircle size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Medical & UPSC</h3>
                <p className="text-slate-400 text-sm mb-6 flex-grow">Curating 10-year patterns for NEET, JEE Main, and Civil Services. Coming soon.</p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                  <span className="text-xs font-semibold text-rose-500">Locked Phase 5</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="animate-fade-in">
          <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8" onClick={handleBackToCategories}>
            <ChevronLeft size={16} /> Back to Disciplines
          </button>
          
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold mb-2">
              Available Exams in <span style={{ color: selectedCategory.color }}>{selectedCategory.name}</span>
            </h2>
            <p className="text-slate-400">Select an exam to load its topic-pairing heatmap and predictive trends dashboard.</p>
          </div>

          <div className="flex flex-col gap-4">
            {exams.map(exam => (
              <div key={exam.id} className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-500/30 cursor-pointer" onClick={() => handleSelectExam(exam)}>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">{exam.full_name} ({exam.name})</h4>
                  <div className="text-sm text-slate-400 flex items-center gap-2">
                    <span><strong className="text-slate-300">Frequency:</strong> {exam.frequency}</span>
                    <span>•</span>
                    <span><strong className="text-slate-300">Body:</strong> {exam.conducting_body}</span>
                  </div>
                </div>
                <button className="bg-white/5 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Enter Dashboard
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
