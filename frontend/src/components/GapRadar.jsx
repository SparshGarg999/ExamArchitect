import React, { useState, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { TrendingUp, Target, Zap, Lock, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950/95 border border-white/10 p-3 rounded-xl shadow-2xl text-xs">
        <p className="font-bold text-white mb-1">{data.subject}</p>
        <p className="text-indigo-400">Your Score: <span className="font-bold">{data.userScore}%</span></p>
        <p className="text-emerald-400">Topper Score: <span className="font-bold">{data.topScore}%</span></p>
        <p className={`mt-1 font-bold ${data.gap > 20 ? 'text-rose-400' : data.gap > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
          Gap: {data.gap > 0 ? `${data.gap.toFixed(1)}% behind` : 'On track!'}
        </p>
      </div>
    );
  }
  return null;
};

export default function GapRadar({ examId }) {
  const { currentUser, token } = useAuth();
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    fetch(`${API_BASE}/api/exams/${examId}/gap-radar`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    })
      .then(res => res.json())
      .then(data => {
        setRadarData(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load GAP Radar data');
        setLoading(false);
        console.error(err);
      });
  }, [examId]);

  if (loading) {
    return (
      <div className="glass-panel p-8 bg-[#121420]/60 flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !radarData) {
    return (
      <div className="glass-panel p-8 bg-[#121420]/60 text-center text-slate-400 min-h-[400px] flex items-center justify-center">
        <p>{error || 'No radar data available.'}</p>
      </div>
    );
  }

  const chartData = radarData.subjects.map((subj, i) => ({
    subject: subj.length > 15 ? subj.slice(0, 14) + '…' : subj,
    fullSubject: subj,
    userScore: radarData.userScores[i],
    topScore: radarData.topScores[i],
    gap: Math.max(0, radarData.topScores[i] - radarData.userScores[i])
  }));

  // Identify weakest subjects
  const sortedByGap = [...chartData].sort((a, b) => b.gap - a.gap);
  const weakestSubjects = sortedByGap.filter(s => s.gap > 10).slice(0, 3);
  const strongSubjects = sortedByGap.filter(s => s.gap <= 10).slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in relative group">
      {/* Login Overlay */}
      {!currentUser ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#121420]/80 backdrop-blur-sm rounded-2xl border border-white/10 transition-all duration-300">
          <div className="bg-[#1e2336] p-6 rounded-2xl border border-indigo-500/20 text-center max-w-sm shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-4">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
            <p className="text-sm text-slate-400 mb-6">
              Sign in to view your personalized Gap Radar and compare your performance against the topper benchmark.
            </p>
            <Link 
              to="/login"
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      ) : radarData?.has_data === false ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#121420]/80 backdrop-blur-sm rounded-2xl border border-white/10 transition-all duration-300">
          <div className="bg-[#1e2336] p-6 rounded-2xl border border-indigo-500/20 text-center max-w-sm shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <Activity size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Performance Data</h3>
            <p className="text-sm text-slate-400 mb-6">
              Take a mock test so your actual scores can be tracked and compared against the topper benchmark!
            </p>
            <Link 
              to="/mock-exam"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              Take a Test Now
            </Link>
          </div>
        </div>
      ) : null}

      {/* Radar Chart Panel */}
      <div className={`glass-panel p-6 bg-[#121420]/60 border border-white/5 rounded-2xl ${(!currentUser || radarData?.has_data === false) ? 'opacity-40 pointer-events-none filter blur-[2px]' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
              <Target size={20} className="text-indigo-400" />
              GAP Radar — Performance vs Toppers
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Compare your historical subject performance against the topper benchmark across all subjects
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chart */}
          <div className="flex-grow min-h-[420px] relative">
            <ResponsiveContainer width="100%" height={420}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                <PolarGrid
                  stroke="rgba(255,255,255,0.06)"
                  gridType="polygon"
                />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#475569', fontSize: 9 }}
                  axisLine={false}
                />
                <Radar
                  name="Topper Benchmark"
                  dataKey="topScore"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                />
                <Radar
                  name="Your Performance"
                  dataKey="userScore"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#6366f1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights Sidebar */}
          <div className="lg:w-[280px] shrink-0 space-y-4">
            {/* Weakness Areas */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Zap size={14} /> Needs Attention
              </h4>
              {weakestSubjects.length > 0 ? (
                <div className="space-y-2">
                  {weakestSubjects.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-medium truncate max-w-[140px]">
                        {s.fullSubject}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.gap > 20 ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        -{s.gap.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">All subjects are on track!</p>
              )}
            </div>

            {/* Strong Areas */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <TrendingUp size={14} /> Strong Areas
              </h4>
              {strongSubjects.length > 0 ? (
                <div className="space-y-2">
                  {strongSubjects.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-medium truncate max-w-[140px]">
                        {s.fullSubject}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                        ✓ {s.userScore.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Keep improving across all subjects!</p>
              )}
            </div>

            {/* Overall Score */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/20">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">Overall GAP Score</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-indigo-400">
                  {chartData.length > 0 ? (chartData.reduce((a, c) => a + c.userScore, 0) / chartData.length).toFixed(0) : 0}%
                </span>
                <span className="text-xs text-slate-500">avg performance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
