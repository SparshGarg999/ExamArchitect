import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, BarChart3, TrendingUp, ListTodo, BookOpen,
  Flame, Calendar, ChevronRight, CheckCircle, Search, Image, MessageSquare, Send, RefreshCw, XCircle,
  Target, Bot, Star, Award, Sparkles, Check, Lock, Play, Printer
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import QuestionCard from '../components/QuestionCard';
import StatCard from '../components/StatCard';
import GapRadar from '../components/GapRadar';
import WeaknessChatbot from '../components/WeaknessChatbot';
import Confetti from '../components/Confetti';
import { API_BASE } from '../config';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);

const COMMON_TOPICS_PRESETS = [
  "Instruction Pipelining",
  "Cache Memory Hierarchy",
  "Relational Algebra & SQL",
  "CPU Scheduling",
  "Time Complexity Analysis",
  "Set Theory & Logic",
  "Regular Languages & Automata",
  "Singly & Doubly Linked Lists",
  "Graph Traversals & BFS/DFS",
  "Transactions & Concurrency",
  "Context-Free Grammars",
  "IP Addressing & Subnetting",
  "Process Synchronization & Semaphores",
  "Page Replacement Algorithms",
  "Hashing & B/B+ Trees",
  "Shortest Path Algorithms"
];

const DURATION_PROFILES = {
  '7': {
    title: '7 Days',
    subtitle: 'Sprint Review',
    desc: 'Intensive high-yield crash revision of core mathematical logic & memory mappings.',
    icon: '⚡',
    gradient: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300'
  },
  '30': {
    title: '30 Days',
    subtitle: 'Standard Prep',
    desc: 'Balanced coverage of programming, OS scheduling, database SQL, and algorithms.',
    icon: '⚖️',
    gradient: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300'
  },
  '90': {
    title: '90 Days',
    subtitle: 'Deep Study',
    desc: 'Comprehensive deep dive including extensive numerical drills & full-length mock papers.',
    icon: '🔍',
    gradient: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300'
  },
  '180': {
    title: '180 Days',
    subtitle: 'Ultimate Mastery',
    desc: 'Full curriculum track with multiple spaced-repetition loops and revision sheets.',
    icon: '🏆',
    gradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300'
  };

const accentColorMap = {
  indigo: { primary: '#6366f1', glow: 'rgba(99, 102, 241, 0.25)', border: 'rgba(99, 102, 241, 0.6)', bg: 'rgba(99, 102, 241, 0.15)', text: 'text-indigo-400' },
  emerald: { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', border: 'rgba(16, 185, 129, 0.6)', bg: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-400' },
  amber: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)', border: 'rgba(245, 158, 11, 0.6)', bg: 'rgba(245, 158, 11, 0.15)', text: 'text-amber-400' },
  rose: { primary: '#f43f5e', glow: 'rgba(244, 63, 94, 0.25)', border: 'rgba(244, 63, 94, 0.6)', bg: 'rgba(244, 63, 94, 0.15)', text: 'text-rose-400' },
};

function QuestionFeedback({ questionId }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('Error in Question');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState(''); // 'sending', 'sent', 'error'
  const { currentUser } = useAuth();

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setStatus('sending');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE}/api/questions/${questionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ feedback_type: type, comments: comment })
      });
      if (res.ok) {
        setStatus('sent');
        setTimeout(() => setOpen(false), 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="mt-4 border-t border-white/5 pt-3">
      <button
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <MessageSquare size={14} /> Report Issue / Provide Feedback
      </button>

      {open && (
        <div className="mt-3 bg-black/30 border border-white/5 p-4 rounded-xl">
          {!currentUser ? (
            <p className="text-xs text-rose-400">Please login to submit feedback.</p>
          ) : status === 'sent' ? (
            <p className="text-xs text-emerald-400 flex items-center gap-2"><CheckCircle size={14} /> Feedback submitted successfully. Thank you!</p>
          ) : (
            <div className="flex flex-col gap-3">
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="bg-black/50 border border-white/10 rounded px-3 py-1.5 text-xs text-white outline-none"
              >
                <option>Error in Question</option>
                <option>Wrong Answer Key</option>
                <option>Formatting Issue</option>
                <option>Other</option>
              </select>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Describe the issue..."
                className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white outline-none min-h-[60px]"
              />
              <button
                onClick={handleSubmit}
                disabled={status === 'sending'}
                className="self-end bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Send size={12} /> {status === 'sending' ? 'Sending...' : 'Submit'}
              </button>
              {status === 'error' && <p className="text-xs text-rose-400">Failed to submit feedback. Try again.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ addToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [selectedExam, setSelectedExam] = useState(null);
  const [activeTab, setActiveTab] = useState('heatmap');
  const [loading, setLoading] = useState(true);

  // Seeding states
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState(null);

  // Data states
  const [heatmapData, setHeatmapData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [papers, setPapers] = useState([]);
  const [studyPlan, setStudyPlan] = useState([]);
  const [examTopics, setExamTopics] = useState([]);

  // Tab specific states
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  // Heatmap view mode ('status', 'marks', 'questions')
  const [heatmapViewMode, setHeatmapViewMode] = useState('status');
  const [heatmapLayout, setHeatmapLayout] = useState('explorer');
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [subtopicHeatmaps, setSubtopicHeatmaps] = useState({});
  const [selectedHeatmapTopic, setSelectedHeatmapTopic] = useState(null);
  const [heatmapSearch, setHeatmapSearch] = useState('');
  const [themeAccent, setThemeAccent] = useState('indigo');
  const topicDetailsRef = useRef(null);

  // Study plan states
  const [studyPlanDays, setStudyPlanDays] = useState('30');
  const [studyPlanWeaknesses, setStudyPlanWeaknesses] = useState('');
  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('studyPlanCompletedTasks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const [studyStreak, setStudyStreak] = useState(() => {
    try {
      const saved = localStorage.getItem('studyPlannerStreak');
      return saved ? parseInt(saved) : 4;
    } catch {
      return 4;
    }
  });

  const [weaknessExpandedSubjects, setWeaknessExpandedSubjects] = useState({});

  // Predictions pagination states
  const [predCurrentPage, setPredCurrentPage] = useState(1);
  const predsPerPage = 10;

  // Tagging corner toast popup state
  const [weaknessPopup, setWeaknessPopup] = useState({ show: false, topic: '', action: 'added' });

  // AI Mentor Chatbot states
  const [mentorChatOpen, setMentorChatOpen] = useState(false);
  const [mentorQuestion, setMentorQuestion] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [certName, setCertName] = useState(() => {
    return currentUser?.username || currentUser?.email?.split('@')[0] || "GATE CS Scholar";
  });

  useEffect(() => {
    if (currentUser) {
      setCertName(currentUser.username || currentUser.email?.split('@')[0] || "GATE CS Scholar");
    }
  }, [currentUser]);

  useEffect(() => {
    setSelectedHeatmapTopic(null);
    setExpandedSubjects({});
    setSubtopicHeatmaps({});
    setHeatmapSearch('');
  }, [id, activeTab, heatmapLayout]);

  useEffect(() => {
    setSelectedPaper(null);
    setQuestions([]);
    setQuestionSearch('');
    setQuestionSubjectFilter('');
    setCurrentPage(1);
    setPredCurrentPage(1);
  }, [id]);

  const handleAskMentor = (question) => {
    setMentorQuestion(question);
    setMentorChatOpen(true);
  };

  const loadExamData = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/exams?category_id=1`)
      .then(res => res.json())
      .then(exams => {
        const ex = exams.find(e => e.id === parseInt(id)) || { id, full_name: 'Exam', name: 'EXAM' };
        setSelectedExam(ex);

        Promise.all([
          fetch(`${API_BASE}/api/exams/${id}/heatmap`).then(res => res.json()),
          fetch(`${API_BASE}/api/exams/${id}/predictions`).then(res => res.json()),
          fetch(`${API_BASE}/api/exams/${id}/papers`).then(res => res.json()),
          fetch(`${API_BASE}/api/exams/${id}/study-plan?total_days=30`).then(res => res.ok ? res.json() : []),
          fetch(`${API_BASE}/api/exams/${id}/topics`).then(res => res.json())
        ])
          .then(([heatmap, preds, papersData, plan, topics]) => {
            setHeatmapData(heatmap);
            setPredictions(preds);
            setPapers(papersData);
            setStudyPlan(plan);
            setExamTopics(topics);
            setLoading(false);
          })
          .catch(err => {
            console.error(err);
            setLoading(false);
          });
      });
  }, [id]);

  useEffect(() => {
    loadExamData();
  }, [id, loadExamData]);

  const fetchQuestionsList = useCallback(() => {
    const params = new URLSearchParams();
    if (questionSearch.trim()) params.set('search', questionSearch.trim());
    if (questionSubjectFilter) params.set('subject_id', questionSubjectFilter);
    params.set('exam_id', id);
    const queryStr = params.toString() ? `?${params.toString()}` : '';

    let url = selectedPaper ? `${API_BASE}/api/papers/${selectedPaper.id}/questions${queryStr}` : `${API_BASE}/api/questions${queryStr}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error(err));
  }, [id, selectedPaper, questionSubjectFilter, questionSearch]);

  useEffect(() => {
    if (activeTab === 'questions') fetchQuestionsList();
  }, [selectedPaper, questionSubjectFilter, activeTab, fetchQuestionsList]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'questions') fetchQuestionsList();
    }, 300);
    return () => clearTimeout(timer);
  }, [questionSearch, activeTab, fetchQuestionsList]);

  useEffect(() => {
    if (selectedHeatmapTopic && topicDetailsRef.current) {
      const timer = setTimeout(() => {
        topicDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedHeatmapTopic]);

  useEffect(() => {
    if (selectedHeatmapTopic && !selectedHeatmapTopic.parent_id) {
      const subjectId = selectedHeatmapTopic.id;
      if (!subtopicHeatmaps[subjectId]) {
        fetch(`${API_BASE}/api/exams/${id}/topics/${subjectId}/heatmap`)
          .then(res => res.json())
          .then(data => {
            setSubtopicHeatmaps(prev => ({ ...prev, [subjectId]: data }));
          })
          .catch(err => console.error('Failed to fetch subtopic heatmap:', err));
      }
    }
  }, [selectedHeatmapTopic, id]);

  const handleReseed = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedMessage({ type: 'info', text: 'Seeding 10 years of historical data from PDF blueprints... This takes a moment.' });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/ingest/bulk`, { 
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSeedMessage({ type: 'success', text: `Seeding complete! Ingested ${data.questions_ingested} questions. Reloading data...` });
        loadExamData();
      } else if (res.status === 401 || res.status === 403) {
        setSeedMessage({ type: 'error', text: 'Security Error: You must be logged in as an Administrator to reset and re-seed the system.' });
      } else {
        setSeedMessage({ type: 'error', text: 'Ingestion pipeline encountered a backend subprocess error.' });
      }
    } catch {
      setSeedMessage({ type: 'error', text: 'Network failure communicating with bulk ingestion API.' });
    } finally {
      setSeeding(false);
    }
  };

  const handleToggleSubject = (subjectRow) => {
    const subjectId = subjectRow.id;
    const isCurrentlyExpanded = expandedSubjects[subjectId];
    setSelectedHeatmapTopic(subjectRow);

    if (isCurrentlyExpanded) {
      setExpandedSubjects(prev => ({ ...prev, [subjectId]: false }));
    } else {
      setExpandedSubjects(prev => ({ ...prev, [subjectId]: true }));
      if (!subtopicHeatmaps[subjectId]) {
        fetch(`${API_BASE}/api/exams/${id}/topics/${subjectId}/heatmap`)
          .then(res => res.json())
          .then(data => {
            setSubtopicHeatmaps(prev => ({ ...prev, [subjectId]: data }));
          })
          .catch(err => console.error('Failed to fetch subtopic heatmap:', err));
      }
    }
  };

  const handleUpdateStudyPlan = async () => {
    if (!currentUser) {
      alert("Please login to generate custom study plans.");
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const body = {
        total_days: parseInt(studyPlanDays) || 30,
        weakness_topics: studyPlanWeaknesses ? studyPlanWeaknesses.split(',').map(s => s.trim()).filter(Boolean) : null
      };
      const res = await fetch(`${API_BASE}/api/exams/${id}/study-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        setStudyPlan(data);
      } else {
        alert("Failed to generate plan");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = (taskKey) => {
    const updated = { ...completedTasks, [taskKey]: !completedTasks[taskKey] };
    setCompletedTasks(updated);
    localStorage.setItem('studyPlanCompletedTasks', JSON.stringify(updated));

    // Check if 100% completed
    if (studyPlan.length > 0) {
      let totalTasks = 0;
      let completedCount = 0;
      studyPlan.forEach(plan => {
        plan.tasks.forEach((task, tIdx) => {
          totalTasks++;
          const key = `${id}-${plan.day}-${tIdx}-${task.slice(0, 20)}`;
          if (updated[key]) completedCount++;
        });
      });

      if (totalTasks > 0 && completedCount === totalTasks) {
        setShowCompletionModal(true);
        if (addToast) {
          addToast("🎉 Congratulations! GATE CS study plan successfully mastered! +5000 XP", "success");
        }
        // Save XP to local profile
        const prevXp = parseInt(localStorage.getItem('user_xp') || '0');
        localStorage.setItem('user_xp', prevXp + 5000);
      }
    }
  };

  const handleToggleWeaknessTag = (topicName) => {
    let list = studyPlanWeaknesses.split(',').map(s => s.trim()).filter(Boolean);
    const lowerList = list.map(s => s.toLowerCase());
    const isRemoving = lowerList.includes(topicName.toLowerCase());

    if (isRemoving) {
      list = list.filter(item => item.toLowerCase() !== topicName.toLowerCase());
    } else {
      list.push(topicName);
    }
    const nextList = list.join(', ');
    setStudyPlanWeaknesses(nextList);

    // Trigger corner popup toast
    setWeaknessPopup({
      show: true,
      topic: topicName,
      action: isRemoving ? 'removed' : 'added'
    });
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setWeaknessPopup(prev => prev.topic === topicName ? { ...prev, show: false } : prev);
    }, 3000);
  };

  const toggleWeaknessSubjectExpansion = (subjectId) => {
    setWeaknessExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const renderHeatmapCell = (marks, questions, avgDifficulty, topic, year, key, tooltipBelow = false) => {
    const topicName = topic?.name || 'Topic';
    let bgIntensity = 'rgba(255,255,255,0.02)';
    let textColor = '#64748b';
    let borderStyle = 'border-white/5';

    if (marks > 0) {
      if (marks <= 3) {
        bgIntensity = `linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(129, 140, 248, 0.15))`;
        textColor = '#a5b4fc';
        borderStyle = 'border-indigo-500/20';
      } else if (marks <= 7) {
        bgIntensity = `linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(139, 92, 246, 0.4))`;
        textColor = '#e9d5ff';
        borderStyle = 'border-purple-500/30';
      } else {
        bgIntensity = `linear-gradient(135deg, rgba(244, 63, 94, 0.8), rgba(236, 72, 153, 0.85))`;
        textColor = '#ffffff';
        borderStyle = 'border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
      }
    }

    let diffText = 'N/A';
    if (avgDifficulty !== null && avgDifficulty !== undefined && avgDifficulty !== 'N/A') {
      const diffVal = parseFloat(avgDifficulty);
      if (!isNaN(diffVal)) {
        diffText = diffVal > 2.3 ? 'Hard' : diffVal > 1.6 ? 'Medium' : 'Easy';
      }
    }

    let cellContent = null;
    if (heatmapViewMode === 'marks') {
      cellContent = <span style={{ color: textColor }}>{marks > 0 ? `${Number(marks.toFixed(1))}m` : '0m'}</span>;
    } else if (heatmapViewMode === 'questions') {
      cellContent = <span style={{ color: textColor }}>{questions > 0 ? `${questions}q` : '0q'}</span>;
    } else if (heatmapViewMode === 'status') {
      if (marks > 0) {
        cellContent = (
          <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
            <span className="text-[10px] font-black text-white leading-none">{Number(marks.toFixed(1))}m</span>
            <span className="text-[8px] font-bold text-slate-400 leading-none">{questions}q</span>
          </div>
        );
      } else {
        cellContent = <span className="text-slate-650 font-medium">—</span>;
      }
    }

    return (
      <div 
        key={key} 
        style={{ background: bgIntensity }} 
        onClick={(e) => {
          e.stopPropagation();
          setSelectedHeatmapTopic(topic);
        }}
        className={`py-2 px-1 rounded-md font-bold text-center text-[9px] leading-tight border ${borderStyle} transition-all hover:scale-[1.05] hover:border-white/30 relative group cursor-pointer ${marks > 7 ? 'shadow-md shadow-rose-950/20 animate-pulse-slow' : ''}`}
      >
        {cellContent}
        
        {/* Custom CSS Hover Tooltip */}
        <div className={`absolute left-1/2 -translate-x-1/2 w-48 bg-slate-950/95 border border-white/10 p-2.5 rounded-lg text-left hidden group-hover:block z-50 pointer-events-none shadow-2xl animate-fade-in text-[10px] font-normal leading-normal whitespace-pre ${
          tooltipBelow ? 'top-full mt-2 bottom-auto' : 'bottom-full mb-2 top-auto'
        }`}>
          <div className="font-bold text-white border-b border-white/5 pb-1 mb-1 truncate">{topicName} ({year})</div>
          <div className="text-indigo-300 font-semibold">Marks Weight: {marks.toFixed(1)} {marks === 1 ? 'mark' : 'marks'}</div>
          <div className="text-purple-300 font-semibold">Questions: {questions} {questions === 1 ? 'question' : 'questions'}</div>
          <div className="text-amber-300 font-semibold">Avg Difficulty: {diffText}</div>
        </div>
      </div>
    );
  };

  const trendChartData = (selectedHeatmapTopic && heatmapData) ? {
    labels: heatmapData.years.length > 0 ? heatmapData.years : [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    datasets: [
      {
        label: `${selectedHeatmapTopic.name} (Marks Weight)`,
        data: (heatmapData.years.length > 0 ? heatmapData.years : [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]).map(y => {
          const yearData = selectedHeatmapTopic.years[y] || selectedHeatmapTopic.years[String(y)];
          if (typeof yearData === 'object' && yearData !== null) {
            return yearData.total_marks || 0;
          }
          return yearData || 0;
        }),
        fill: true,
        backgroundColor: `${accentColorMap[themeAccent].primary}15`,
        borderColor: accentColorMap[themeAccent].primary,
        borderWidth: 2.5,
        pointBackgroundColor: accentColorMap[themeAccent].primary,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: accentColorMap[themeAccent].primary,
        tension: 0.3,
      }
    ]
  } : null;

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(10, 11, 16, 0.95)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        padding: 12,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { 
          color: '#94a3b8', 
          font: { family: 'Plus Jakarta Sans', size: 10 },
          callback: (value) => `${value} marks`
        },
        suggestedMin: 0,
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 flex justify-center items-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-7xl animate-fade-in pb-16 relative">
      
      {/* Weakness Tagging Corner Toast Popup Notification */}
      {weaknessPopup.show && (
        <div className="fixed bottom-6 right-6 bg-[#121420] border border-white/10 p-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-up bg-gradient-to-br from-[#121420] to-[#1a1d30] max-w-sm">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            weaknessPopup.action === 'added' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-rose-500/15 text-rose-400'
          }`}>
            <CheckCircle size={16} />
          </div>
          <div>
            <strong className="text-xs text-white block">Weakness Targets Updated</strong>
            <span className="text-[10px] text-slate-400 leading-normal">
              {weaknessPopup.action === 'added' 
                ? `Tagged "${weaknessPopup.topic}" to prioritize it in study plans.`
                : `Removed "${weaknessPopup.topic}" from study plan targets.`
              }
            </span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      {/* Header Banner */}
      <div 
        className="glass-panel p-6 mb-8 border-l-4 flex flex-wrap justify-between items-center gap-6 bg-[#121420]/80 transition-all duration-300"
        style={{ borderLeftColor: accentColorMap[themeAccent].primary }}
      >
        <div>
          <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-2 cursor-pointer" onClick={() => navigate('/')}>
            <ChevronLeft size={16} /> Choose Exam
          </button>
          <h2 className="text-2xl font-bold font-display">{selectedExam?.full_name || 'Exam'} Dashboard</h2>
        </div>
        <div className="flex flex-wrap items-center gap-6 shrink-0 ml-auto">
          {/* Glowing Premium Color Accent Customizer Picker */}
          <div className="flex items-center gap-2 bg-black/45 border border-white/10 rounded-xl p-1.5 shadow-2xl relative overflow-hidden group">
            <div className="absolute -inset-1 opacity-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-[8px] animate-pulse"></div>
            <span className="text-[9px] uppercase font-black text-slate-400 px-1 relative z-10 tracking-wider">Accent</span>
            {[
              { id: 'indigo', color: 'bg-indigo-500', glow: 'shadow-[0_0_10px_#6366f1]' },
              { id: 'emerald', color: 'bg-emerald-500', glow: 'shadow-[0_0_10px_#10b981]' },
              { id: 'amber', color: 'bg-amber-500', glow: 'shadow-[0_0_10px_#f59e0b]' },
              { id: 'rose', color: 'bg-rose-500', glow: 'shadow-[0_0_10px_#f43f5e]' }
            ].map(theme => (
              <button
                key={theme.id}
                onClick={() => setThemeAccent(theme.id)}
                className={`w-4 h-4 rounded-full ${theme.color} border transition-all duration-350 cursor-pointer relative z-10 ${
                  themeAccent === theme.id 
                    ? `border-white scale-[1.2] ${theme.glow}` 
                    : 'border-transparent opacity-50 hover:opacity-100 hover:scale-[1.1]'
                }`}
                title={`Switch primary accent to ${theme.id}`}
              />
            ))}
          </div>
          
          <StatCard title="Database Papers" value={`${papers.length} Years`} color={themeAccent} />
          <StatCard title="AI Confidence" value="94.2%" color="emerald" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-8 overflow-x-auto">
        {[
          { id: 'heatmap', icon: BarChart3, label: 'Topic Heatmap' },
          { id: 'predictions', icon: TrendingUp, label: 'AI Predictions' },
          { id: 'studyplan', icon: ListTodo, label: 'Dynamic Study Plan' },
          { id: 'gapradar', icon: Target, label: 'Performance Gap Radar' },
          { id: 'questions', icon: BookOpen, label: 'Question Browser' }
        ].map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              className={`flex items-center gap-2 px-6 py-3.5 font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'text-white' 
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={isActive ? { 
                borderBottomColor: accentColorMap[themeAccent].primary, 
                backgroundColor: `${accentColorMap[themeAccent].primary}15`
              } : {}}
              onClick={() => setActiveTab(t.id)}
            >
              <t.icon size={18} style={isActive ? { color: accentColorMap[themeAccent].primary } : {}} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* HEATMAP TAB */}
      {activeTab === 'heatmap' && (
        <div className="space-y-8 animate-fade-in">
          <div className="glass-panel p-6 bg-[#121420]/60">
            <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
              <div>
                <h3 className="text-xl font-bold">Decadal Topic Heatmap</h3>
                <p className="text-sm text-slate-400 mt-1">Click a subject parent row to drill down into subtopic weight distributions over the last 10 years.</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Search Bar for Topic Heatmap */}
                <div className="bg-black/40 border border-white/10 rounded-xl flex items-center px-3 focus-within:border-indigo-500/50 transition-colors w-[220px] h-[34px]"
                     style={{ borderColor: heatmapSearch ? accentColorMap[themeAccent].primary : 'rgba(255,255,255,0.1)' }}>
                  <Search size={14} className="text-slate-400" />
                  <input 
                    type="text" 
                    value={heatmapSearch} 
                    onChange={e => setHeatmapSearch(e.target.value)} 
                    placeholder="Search subjects..." 
                    className="bg-transparent border-none text-white w-full py-1 px-2 focus:outline-none text-[11px] font-medium" 
                  />
                  {heatmapSearch && (
                    <button onClick={() => setHeatmapSearch('')} className="text-slate-400 hover:text-white cursor-pointer ml-1 shrink-0">
                      <XCircle size={14} />
                    </button>
                  )}
                </div>

                {/* Segmented Controls for Heatmap Layout Switcher */}
                <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 shrink-0">
                  {[
                    { id: 'explorer', label: 'Interactive Explorer' },
                    { id: 'grid', label: 'Decadal Grid' }
                  ].map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => setHeatmapLayout(layout.id)}
                      className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer rounded-lg ${
                        heatmapLayout === layout.id
                          ? 'text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      style={heatmapLayout === layout.id ? {
                        backgroundColor: accentColorMap[themeAccent].primary,
                        boxShadow: `0 4px 12px ${accentColorMap[themeAccent].glow}`
                      } : {}}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>

                {/* Segmented Controls for Heatmap View Mode */}
                {heatmapLayout === 'grid' && (
                  <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 shrink-0">
                    {['status', 'marks', 'questions'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setHeatmapViewMode(mode)}
                        className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer rounded-lg ${
                          heatmapViewMode === mode
                            ? 'text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        style={heatmapViewMode === mode ? {
                          backgroundColor: accentColorMap[themeAccent].primary,
                          boxShadow: `0 4px 12px ${accentColorMap[themeAccent].glow}`
                        } : {}}
                      >
                        {mode === 'status' ? 'Overview' : mode === 'marks' ? 'Marks' : 'Questions'}
                      </button>
                    ))}
                  </div>
                )}

                <button 
                  onClick={handleReseed}
                  disabled={seeding}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold py-2 px-4 rounded-xl border border-white/10 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 h-[34px]"
                >
                  {seeding ? <RefreshCw className="animate-spin" size={12} /> : null}
                  {seeding ? 'Ingesting...' : 'Reset & Re-seed'}
                </button>
              </div>
            </div>

            {seedMessage && (
              <div className={`p-4 rounded-xl mb-6 text-sm border ${
                seedMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                seedMessage.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}>
                {seedMessage.text}
              </div>
            )}

            <div>
              {heatmapData && heatmapData.data?.length > 0 ? (
                (() => {
                  const years = heatmapData.years.length > 0 ? heatmapData.years : [2015, 2016, 2017, 2018, 2019, 2020];
                  const parentTopicMap = {};
                  
                  heatmapData.data.forEach(t => {
                    if (!t.parent_id) {
                      parentTopicMap[t.id] = { id: t.id, name: t.name, years: {} };
                      years.forEach(y => {
                        parentTopicMap[t.id].years[y] = {
                          total_marks: 0,
                          question_count: 0,
                          avg_difficulty: null,
                          difficulty_sum: 0,
                          difficulty_count: 0
                        };
                      });
                    }
                  });

                  if (Object.keys(parentTopicMap).length === 0) {
                    heatmapData.data.forEach(t => {
                      parentTopicMap[t.id] = { id: t.id, name: t.name, years: {} };
                      years.forEach(y => {
                        parentTopicMap[t.id].years[y] = {
                          total_marks: 0,
                          question_count: 0,
                          avg_difficulty: null,
                          difficulty_sum: 0,
                          difficulty_count: 0
                        };
                      });
                    });
                  }

                  heatmapData.data.forEach(t => {
                    const parentId = t.parent_id || t.id;
                    if (parentTopicMap[parentId]) {
                      Object.entries(t.years || {}).forEach(([y, data]) => {
                        if (!parentTopicMap[parentId].years[y]) {
                          parentTopicMap[parentId].years[y] = {
                            total_marks: 0,
                            question_count: 0,
                            avg_difficulty: null,
                            difficulty_sum: 0,
                            difficulty_count: 0
                          };
                        }
                        const pYear = parentTopicMap[parentId].years[y];
                        pYear.total_marks += (data.total_marks || 0);
                        pYear.question_count += (data.question_count || 0);
                        
                        if (data.avg_difficulty !== null && data.avg_difficulty !== undefined && data.avg_difficulty !== 'N/A') {
                          const diffVal = parseFloat(data.avg_difficulty);
                          const qCount = data.question_count || 0;
                          if (!isNaN(diffVal) && qCount > 0) {
                            pYear.difficulty_sum += diffVal * qCount;
                            pYear.difficulty_count += qCount;
                          }
                        }
                      });
                    }
                  });

                  Object.values(parentTopicMap).forEach(row => {
                    Object.keys(row.years).forEach(y => {
                      const stat = row.years[y];
                      if (stat.difficulty_count && stat.difficulty_count > 0) {
                        stat.avg_difficulty = stat.difficulty_sum / stat.difficulty_count;
                      } else {
                        stat.avg_difficulty = null;
                      }
                    });
                  });

                  const totalExamMarks = Object.values(parentTopicMap).reduce((acc, row) => {
                    const marksSum = Object.values(row.years).reduce((s, y) => s + (y.total_marks || 0), 0);
                    return acc + marksSum;
                  }, 0) || 1;

                  const renderSparkline = (rowYears, yearsArray) => {
                    const points = yearsArray.map((y, index) => {
                      const val = (rowYears[y] && typeof rowYears[y] === 'object') ? (rowYears[y].total_marks || 0) : 0;
                      return { x: index, y: val };
                    });
                    
                    const maxVal = Math.max(...points.map(p => p.y), 1);
                    const width = 110;
                    const height = 28;
                    const padding = 2;
                    
                    const svgPoints = points.map(p => {
                      const x = padding + (p.x / (yearsArray.length - 1)) * (width - 2 * padding);
                      const y = height - padding - (p.y / maxVal) * (height - 2 * padding);
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <svg width={width} height={height} className="overflow-visible">
                        <polyline
                          fill="none"
                          stroke="rgba(99, 102, 241, 0.15)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={svgPoints}
                        />
                        <polyline
                          fill="none"
                          stroke="url(#sparkline-gradient-card)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={svgPoints}
                        />
                        {points.length > 0 && (() => {
                          const lastP = points[points.length - 1];
                          const cx = padding + (lastP.x / (yearsArray.length - 1)) * (width - 2 * padding);
                          const cy = height - padding - (lastP.y / maxVal) * (height - 2 * padding);
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r="3"
                              className="fill-indigo-400 stroke-[#121420] stroke-2 animate-pulse"
                            />
                          );
                        })()}
                        <defs>
                          <linearGradient id="sparkline-gradient-card" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                    );
                  };

                  const subjectsList = Object.values(parentTopicMap).map(row => {
                    const totalSubjectMarks = Object.values(row.years).reduce((s, y) => s + (y.total_marks || 0), 0);
                    const totalSubjectQuestions = Object.values(row.years).reduce((s, y) => s + (y.question_count || 0), 0);
                    const decadalYield = (totalSubjectMarks / totalExamMarks) * 100;
                    
                    const validDiffs = Object.values(row.years).filter(y => y.avg_difficulty !== null);
                    let avgDifficulty = null;
                    if (validDiffs.length > 0) {
                      const sumDiff = validDiffs.reduce((s, y) => s + y.avg_difficulty * (y.question_count || 1), 0);
                      const countDiff = validDiffs.reduce((s, y) => s + (y.question_count || 1), 0);
                      avgDifficulty = countDiff > 0 ? sumDiff / countDiff : null;
                    }
                    
                    return {
                      ...row,
                      totalSubjectMarks,
                      totalSubjectQuestions,
                      decadalYield,
                      avgDifficulty
                    };
                  const filteredSubjectsList = subjectsList.filter(s => {
                    const matchesSubject = s.name.toLowerCase().includes(heatmapSearch.toLowerCase());
                    const matchesSubtopic = subtopicHeatmaps[s.id]?.subtopics?.some(sub => 
                      sub.name.toLowerCase().includes(heatmapSearch.toLowerCase())
                    ) || false;
                    return matchesSubject || matchesSubtopic;
                  });

                  const filteredParentTopicMap = Object.values(parentTopicMap).filter(row => {
                    const matchesSubject = row.name.toLowerCase().includes(heatmapSearch.toLowerCase());
                    const matchesSubtopic = subtopicHeatmaps[row.id]?.subtopics?.some(sub => 
                      sub.name.toLowerCase().includes(heatmapSearch.toLowerCase())
                    ) || false;
                    return matchesSubject || matchesSubtopic;
                  });

                  if (heatmapLayout === 'grid') {
                    return (
                      <div className="overflow-x-auto bg-[#191c2c]/30 rounded-xl p-4 border border-white/5 custom-scrollbar">
                        <div className="min-w-[1000px]">
                          {/* Grid Header */}
                          <div className="grid gap-1 mb-2 border-b border-white/10 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider" style={{ gridTemplateColumns: `260px repeat(${years.length}, minmax(0, 1fr))` }}>
                            <div className="min-w-0 truncate pr-2">Subject / Subtopic</div>
                            {years.map(y => <div key={y} className="text-center min-w-0 overflow-hidden">{y}</div>)}
                          </div>

                          {/* Empty State for grid search */}
                          {filteredParentTopicMap.length === 0 && (
                            <div className="text-center py-12 glass-panel border border-white/5 rounded-2xl bg-[#121420]/40 my-2">
                              <span className="text-2xl block mb-2">🔍</span>
                              <h4 className="text-sm font-bold text-white mb-1">No matching subjects or subtopics found</h4>
                              <p className="text-xs text-slate-400">Try adjusting your search keyword filter at the top.</p>
                            </div>
                          )}

                          {/* Parent Rows */}
                          {filteredParentTopicMap.map((row, rowIndex) => {
                            const isExpanded = !!expandedSubjects[row.id];
                            const subtopicData = subtopicHeatmaps[row.id];
                            
                            return (
                              <React.Fragment key={row.id}>
                                <div 
                                  onClick={() => handleToggleSubject(row)}
                                  className={`grid gap-1 items-center py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors px-2 rounded-lg ${
                                    selectedHeatmapTopic?.id === row.id ? 'bg-indigo-500/10' : ''
                                  }`}
                                  style={{ gridTemplateColumns: `260px repeat(${years.length}, minmax(0, 1fr))` }}
                                >
                                  <div className="text-sm font-semibold text-white flex items-center gap-2 min-w-0 overflow-hidden pr-2">
                                    <ChevronRight size={14} className={`text-indigo-400 transition-transform ${isExpanded ? 'rotate-90' : ''} shrink-0`} />
                                    <span className="truncate">{row.name}</span>
                                  </div>
                                  {years.map((y, i) => {
                                    const stat = row.years[y] || { total_marks: 0, question_count: 0, avg_difficulty: null };
                                    return renderHeatmapCell(stat.total_marks, stat.question_count, stat.avg_difficulty, row, y, `${row.id}-${y}-${i}`, rowIndex <= 1);
                                  })}
                                </div>

                                {/* Subtopics Accordion */}
                                <div 
                                  className={`transition-all duration-350 ease-out overflow-hidden ${
                                    isExpanded ? 'max-h-[600px] opacity-100 my-1' : 'max-h-0 opacity-0 pointer-events-none'
                                  }`}
                                >
                                  <div className="py-2 bg-black/20 rounded-lg space-y-1">
                                    {subtopicData ? (
                                      subtopicData.subtopics.length > 0 ? (
                                        subtopicData.subtopics.map(sub => (
                                          <div 
                                            key={sub.id} 
                                            onClick={() => setSelectedHeatmapTopic(sub)}
                                            className={`grid gap-1 items-center py-1.5 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors px-2 rounded-lg ${
                                              selectedHeatmapTopic?.id === sub.id ? 'bg-purple-500/10 border border-purple-500/20' : ''
                                            }`}
                                            style={{ gridTemplateColumns: `260px repeat(${years.length}, minmax(0, 1fr))` }}
                                          >
                                            <div className="text-xs text-slate-300 font-medium pl-6 truncate min-w-0 pr-2" title={sub.name}>{sub.name}</div>
                                            {years.map((y, i) => {
                                              const subYearData = sub.years[String(y)] || sub.years[y] || { total_marks: 0, question_count: 0, avg_difficulty: null };
                                              return renderHeatmapCell(
                                                subYearData.total_marks || 0, 
                                                subYearData.question_count || 0, 
                                                subYearData.avg_difficulty || null, 
                                                sub, 
                                                y, 
                                                `${sub.id}-${y}-${i}`,
                                                rowIndex <= 1
                                              );
                                            })}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="p-3 text-xs text-slate-400 italic pl-8">No subtopics registered for this subject.</div>
                                      )
                                    ) : (
                                      <div className="flex items-center gap-2 p-3 text-xs text-slate-500">
                                        <RefreshCw className="animate-spin" size={12} /> Loading subtopics...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    );
                  } else {
                    // Render Upgraded Premium Interactive Explorer Cards
                    let dynamicFocusLabel = 'Decadal Focus Area';
                    let dynamicFocusName = '';
                    let dynamicFocusVal = '';

                    if (selectedHeatmapTopic) {
                      if (selectedHeatmapTopic.parent_id) {
                        dynamicFocusLabel = 'Selected Subtopic Yield';
                        dynamicFocusName = selectedHeatmapTopic.name;
                        const subMarks = Object.values(selectedHeatmapTopic.years).reduce((s, y) => s + (y.total_marks || 0), 0);
                        const parentRow = subjectsList.find(s => s.id === selectedHeatmapTopic.parent_id);
                        const parentWeight = parentRow ? parentRow.totalSubjectMarks : 1;
                        const subShare = (subMarks / parentWeight) * 100;
                        dynamicFocusVal = `${subMarks.toFixed(1)}m (${Math.round(subShare)}% subject share)`;
                      } else {
                        const subjectId = selectedHeatmapTopic.id;
                        const parentRow = subjectsList.find(s => s.id === subjectId);
                        
                        if (subtopicHeatmaps[subjectId]?.subtopics) {
                          const subList = subtopicHeatmaps[subjectId].subtopics.map(sub => {
                            const subMarks = Object.values(sub.years).reduce((s, y) => s + (y.total_marks || 0), 0);
                            return { name: sub.name, marks: subMarks };
                          });
                          const topSub = [...subList].sort((a, b) => b.marks - a.marks)[0];
                          if (topSub) {
                            dynamicFocusLabel = 'Subject Hotspot';
                            dynamicFocusName = topSub.name;
                            const parentWeight = parentRow ? parentRow.totalSubjectMarks : 1;
                            const subShare = (topSub.marks / parentWeight) * 100;
                            dynamicFocusVal = `${topSub.marks.toFixed(1)}m (${Math.round(subShare)}% share)`;
                          }
                        } else {
                          dynamicFocusLabel = 'Selected Subject Yield';
                          dynamicFocusName = selectedHeatmapTopic.name;
                          dynamicFocusVal = `${parentRow ? parentRow.decadalYield.toFixed(1) : 0}% yield`;
                        }
                      }
                    } else {
                      const sorted = [...subjectsList].sort((a, b) => b.totalSubjectMarks - a.totalSubjectMarks);
                      if (sorted[0]) {
                        dynamicFocusLabel = 'Decadal Focus Area';
                        dynamicFocusName = sorted[0].name;
                        dynamicFocusVal = `${sorted[0].decadalYield.toFixed(1)}% yield`;
                      }
                    }

                    return (
                      <div className="space-y-6">
                        {/* Upgraded Summary KPIs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-scale-up-glow">
                          <div className="bg-[#191c2c]/45 border border-white/5 p-4 rounded-2xl flex flex-col justify-between animate-fade-in-up hover-premium-lift transition-all">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Exam Syllabus Yield</span>
                              <Award size={16} className="text-indigo-400" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                              <strong className="text-2xl font-black text-indigo-400">{Math.round(totalExamMarks)}</strong>
                              <span className="text-slate-400 text-xs font-semibold">Total Marks Weight</span>
                            </div>
                          </div>

                          <div className="bg-[#191c2c]/45 border border-white/5 p-4 rounded-2xl flex flex-col justify-between animate-fade-in-up hover-premium-lift transition-all relative overflow-hidden">
                            {selectedHeatmapTopic && (
                              <div className="absolute -right-2 -bottom-2 w-10 h-10 rounded-full filter blur-[15px] opacity-20 bg-rose-500 animate-pulse"></div>
                            )}
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">{dynamicFocusLabel}</span>
                              <Target size={16} className="text-rose-450 animate-pulse" />
                            </div>
                            <div className="mt-2">
                              <strong className="text-sm font-black text-white truncate max-w-[220px] block" title={dynamicFocusName}>
                                {dynamicFocusName || 'Algorithms'}
                              </strong>
                              <span className="text-slate-400 text-xs font-semibold">{dynamicFocusVal}</span>
                            </div>
                          </div>

                          <div className="bg-[#191c2c]/45 border border-white/5 p-4 rounded-2xl flex flex-col justify-between animate-fade-in-up hover-premium-lift transition-all">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Highest Yield Share</span>
                              <TrendingUp size={16} className="text-emerald-400" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                              <strong className="text-2xl font-black text-emerald-400">
                                {[...subjectsList].sort((a,b) => b.totalSubjectMarks - a.totalSubjectMarks)[0]?.decadalYield.toFixed(1)}%
                              </strong>
                              <span className="text-slate-400 text-xs font-semibold">of entire exam</span>
                            </div>
                          </div>

                          <div className="bg-[#191c2c]/45 border border-white/5 p-4 rounded-2xl flex flex-col justify-between animate-fade-in-up hover-premium-lift transition-all">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Dataset Coverage</span>
                              <BookOpen size={16} className="text-purple-400" />
                            </div>
                            <div className="mt-2">
                              <strong className="text-2xl font-black text-purple-400 block">
                                {subjectsList.reduce((acc, row) => acc + (row.totalSubjectQuestions || 0), 0).toLocaleString()}
                              </strong>
                              <span className="text-slate-400 text-xs font-semibold">Solved & Verified Pool (2011-2025)</span>
                            </div>
                          </div>
                        </div>

                        {/* Explorer Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                          {filteredSubjectsList.length === 0 && (
                            <div className="col-span-full text-center py-12 glass-panel border border-white/5 rounded-2xl bg-[#121420]/40 my-4 animate-scale-up-glow">
                              <span className="text-2xl block mb-2">🔍</span>
                              <h4 className="text-sm font-bold text-white mb-1">No matching subjects or subtopics found</h4>
                              <p className="text-xs text-slate-400">Try adjusting your search keyword filter above.</p>
                            </div>
                          )}

                          {[...filteredSubjectsList].sort((a, b) => b.totalSubjectMarks - a.totalSubjectMarks).map(row => {
                            const isExpanded = !!expandedSubjects[row.id];
                            const subtopicData = subtopicHeatmaps[row.id];
                            
                            // Compute dynamic yield status tag
                            let yieldTag = 'Consistent 📈';
                            let tagColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
                            
                            const sortedYields = [...subjectsList].sort((a, b) => b.totalSubjectMarks - a.totalSubjectMarks);
                            const top3Ids = sortedYields.slice(0, 3).map(s => s.id);
                            
                            if (top3Ids.includes(row.id)) {
                              yieldTag = 'Critical Core 🎯';
                              tagColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                            } else {
                              const recentMarks = (row.years['2023']?.total_marks || 0) + (row.years['2024']?.total_marks || 0) + (row.years['2025']?.total_marks || 0);
                              const olderMarks = (row.years['2015']?.total_marks || 0) + (row.years['2016']?.total_marks || 0) + (row.years['2017']?.total_marks || 0);
                              if (recentMarks > olderMarks + 2) {
                                yieldTag = 'Rising 🔥';
                                tagColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                              }
                            }

                            // Compute HSL difficulty segments
                            let easyPct = 40, medPct = 40, hardPct = 20;
                            if (row.avgDifficulty !== null) {
                              const norm = row.avgDifficulty;
                              if (norm > 2.3) {
                                hardPct = Math.round((norm - 2.0) * 80);
                                medPct = Math.round((3.0 - norm) * 80);
                                easyPct = 100 - hardPct - medPct;
                              } else if (norm > 1.6) {
                                medPct = Math.round((norm - 1.0) * 70);
                                hardPct = Math.round((norm - 1.6) * 40);
                                easyPct = 100 - medPct - hardPct;
                              } else {
                                easyPct = Math.round((2.0 - norm) * 90);
                                medPct = Math.round((norm - 1.0) * 90);
                                hardPct = 100 - easyPct - medPct;
                              }
                              hardPct = Math.max(5, Math.min(80, hardPct));
                              medPct = Math.max(10, Math.min(80, medPct));
                              easyPct = 100 - hardPct - medPct;
                            }
                            
                            // Infer style mix
                            let mcqP = 55, msqP = 15, natP = 30;
                            const lowerName = row.name.toLowerCase();
                            if (lowerName.includes("theory") || lowerName.includes("compiler") || lowerName.includes("logic")) {
                              mcqP = 60; msqP = 25; natP = 15;
                            } else if (lowerName.includes("architecture") || lowerName.includes("organization") || lowerName.includes("structure") || lowerName.includes("networks") || lowerName.includes("system")) {
                              mcqP = 45; msqP = 10; natP = 45;
                            } else if (lowerName.includes("mathematics") || lowerName.includes("aptitude") || lowerName.includes("algorithms")) {
                              mcqP = 50; msqP = 5; natP = 45;
                            }

                            let diffText = 'Easy 📋';
                            let diffColor = 'text-emerald-400';
                            if (row.avgDifficulty !== null) {
                              if (row.avgDifficulty > 2.2) {
                                diffText = 'Hard 🔥';
                                diffColor = 'text-rose-400';
                              } else if (row.avgDifficulty > 1.6) {
                                diffText = 'Medium ⚡';
                                diffColor = 'text-amber-400';
                              }
                            }

                            return (
                              <div 
                                key={row.id}
                                onClick={() => setSelectedHeatmapTopic(row)}
                                className={`glass-panel p-5 bg-[#121420]/75 border rounded-2xl relative overflow-hidden flex flex-col justify-between group cursor-pointer animate-fade-in-up hover-premium-lift transition-all duration-350 ${
                                  selectedHeatmapTopic?.id === row.id 
                                    ? 'border-indigo-500/60 bg-[#121420]/95 shadow-[0_0_30px_rgba(99,102,241,0.25)]' 
                                    : 'border-white/5'
                                }`}
                              >
                                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full filter blur-[50px] opacity-10 bg-indigo-500 group-hover:opacity-20 transition-opacity"></div>
                                
                                <div>
                                  <div className="flex justify-between items-start gap-3 mb-4">
                                    <div className="min-w-0 flex-grow">
                                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500">Subject</span>
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider scale-[0.9] origin-left ${tagColor}`}>
                                          {yieldTag}
                                        </span>
                                      </div>
                                      <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight line-clamp-1">{row.name}</h4>
                                    </div>
                                    <div className="shrink-0 bg-black/30 p-1 rounded-lg border border-white/5" title="Decadal Trend Trajectory">
                                      {renderSparkline(row.years, years)}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-black/30 p-2 rounded-xl border border-white/5 text-center">
                                      <span className="text-[8px] text-slate-400 block font-medium uppercase">Yield</span>
                                      <strong className="text-sm font-extrabold text-indigo-400">{row.decadalYield.toFixed(1)}%</strong>
                                    </div>
                                    <div className="bg-black/30 p-2 rounded-xl border border-white/5 text-center">
                                      <span className="text-[8px] text-slate-400 block font-medium uppercase">Marks</span>
                                      <strong className="text-sm font-extrabold text-white">{row.totalSubjectMarks.toFixed(1)}m</strong>
                                    </div>
                                    <div className="bg-black/30 p-2 rounded-xl border border-white/5 text-center">
                                      <span className="text-[8px] text-slate-400 block font-medium uppercase">Difficulty</span>
                                      <strong className={`text-[10px] font-extrabold ${diffColor}`}>{diffText}</strong>
                                    </div>
                                  </div>

                                  <div className="space-y-1 mb-3">
                                    <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                                      <span>Difficulty Mix</span>
                                      <span className="text-slate-300">{easyPct}% E / {medPct}% M / {hardPct}% H</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-white/5 border border-white/5">
                                      <div style={{ width: `${easyPct}%` }} className="h-full bg-emerald-500" title={`Easy: ${easyPct}%`}></div>
                                      <div style={{ width: `${medPct}%` }} className="h-full bg-amber-500" title={`Medium: ${medPct}%`}></div>
                                      <div style={{ width: `${hardPct}%` }} className="h-full bg-rose-500" title={`Hard: ${hardPct}%`}></div>
                                    </div>
                                  </div>

                                  <div className="space-y-1 mb-4">
                                    <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                                      <span>Question Style DNA</span>
                                      <span className="text-slate-300">{mcqP}% MCQ / {msqP}% MSQ / {natP}% NAT</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-white/5 border border-white/5">
                                      <div style={{ width: `${mcqP}%` }} className="h-full bg-indigo-500" title={`MCQ: ${mcqP}%`}></div>
                                      <div style={{ width: `${msqP}%` }} className="h-full bg-purple-500" title={`MSQ: ${msqP}%`}></div>
                                      <div style={{ width: `${natP}%` }} className="h-full bg-pink-500" title={`NAT: ${natP}%`}></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSubject(row);
                                    }}
                                    className="w-full flex items-center justify-between text-[11px] font-bold px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <BarChart3 size={12} className="text-indigo-400" />
                                      {isExpanded ? 'Hide Subtopic Drilldown' : 'Drilldown Subtopics'}
                                    </span>
                                    <ChevronRight size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  </button>

                                  <div 
                                    className={`transition-all duration-350 ease-out overflow-hidden ${
                                      isExpanded ? 'max-h-[240px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="py-2 px-2.5 bg-black/40 rounded-xl space-y-2 border border-white/5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                      {subtopicData ? (
                                        subtopicData.subtopics.map(sub => {
                                          const subMarks = Object.values(sub.years).reduce((s, y) => s + (y.total_marks || 0), 0);
                                          const subQCount = Object.values(sub.years).reduce((s, y) => s + (y.question_count || 0), 0);
                                          const subShare = row.totalSubjectMarks > 0 ? (subMarks / row.totalSubjectMarks) * 100 : 0;
                                          
                                          return (
                                            <div key={sub.id} className="border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                                              <div className="flex justify-between items-center text-xs font-semibold text-white">
                                                <span 
                                                  className={`truncate max-w-[130px] transition-colors ${
                                                    selectedHeatmapTopic?.id === sub.id ? 'text-indigo-400 font-extrabold' : 'text-slate-300 hover:text-indigo-300'
                                                  }`}
                                                  title={sub.name}
                                                  onClick={() => setSelectedHeatmapTopic(sub)}
                                                >
                                                  {sub.name}
                                                </span>
                                                <span className="text-[10px] text-indigo-400 shrink-0 font-extrabold">{subMarks.toFixed(1)}m ({subQCount}q)</span>
                                              </div>
                                              <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-grow h-1 bg-white/5 rounded-full overflow-hidden">
                                                  <div style={{ width: `${subShare}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-pink-500"></div>
                                                </div>
                                                <span className="text-[9px] text-slate-500 font-bold shrink-0">{Math.round(subShare)}% share</span>
                                              </div>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                                          <RefreshCw className="animate-spin" size={12} /> Loading subtopics...
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                })()
              ) : (
                <p className="text-center text-slate-400 py-10">No heatmap data available. Click "Reset & Re-seed" above.</p>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Weightage Color Index:</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/5 border border-white/10"></span> 0 marks</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-500/30"></span> Low Weight (1-3 marks)</span>
<span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500/50 border border-purple-500/60"></span> Medium Weight (4-7 marks)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500/80 border border-rose-500"></span> Critical Weight (&gt;7 marks)</span>
            </div>
          </div>

          {/* Interactive Line Chart details */}
                <div className="flex-grow relative h-[240px]">
                  <Line data={trendChartData} options={trendChartOptions} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PREDICTIONS TAB */}
      {activeTab === 'predictions' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 flex items-center gap-4 bg-[#121420]/60 border-l-4 border-l-amber-500 border-white/5">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Flame size={24} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Top AI Target Focus</span>
                <h4 className="text-lg font-bold text-white mt-0.5">{predictions[0]?.topic_name || 'Instruction Pipelining'}</h4>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-6 text-white font-display">Upcoming Exam Probability Analysis</h3>
            
            {predictions.length === 0 ? (
              <p className="text-center text-slate-400 py-10 glass-panel bg-[#121420]/60">No probability predictions computed yet. Seed historical data first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {predictions.slice((predCurrentPage - 1) * predsPerPage, predCurrentPage * predsPerPage).map((pred, i) => {
                  const probPct = Math.round(pred.predicted_probability * 100);
                  const isWeakness = studyPlanWeaknesses.split(',').map(s => s.trim().toLowerCase()).includes(pred.topic_name.toLowerCase());
                  
                  let tagColor = 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20';
                  let gaugeColor = 'text-indigo-400';
                  if (probPct >= 90) {
                    tagColor = 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
                    gaugeColor = 'text-rose-500';
                  } else if (probPct >= 80) {
                    tagColor = 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
                    gaugeColor = 'text-amber-500';
                  }

                  return (
                    <div key={i} className="glass-panel p-5 bg-[#121420]/60 flex flex-col justify-between border border-white/5 hover:border-indigo-500/20 transition-all hover:scale-[1.01] shadow-lg rounded-2xl relative overflow-hidden">
                      {/* Glow background decoration */}
                      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full filter blur-[40px] opacity-10 ${
                        probPct >= 90 ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}></div>

                      <div>
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="min-w-0">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block truncate">
                              {pred.parent_topic_name || 'General Course'}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-1 leading-tight line-clamp-2">{pred.topic_name}</h4>
                          </div>
                          
                          {/* Radial Percentage Circle */}
                          <div className="flex flex-col items-center shrink-0">
                            <div className="relative flex items-center justify-center w-12 h-12">
                              <svg className="w-12 h-12 transform -rotate-90">
                                <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.05)" strokeWidth="3" fill="transparent" />
                                <circle 
                                  cx="24" cy="24" r="20" 
                                  stroke="currentColor" 
                                  strokeWidth="3" 
                                  fill="transparent" 
                                  className={gaugeColor}
                                  strokeDasharray={2 * Math.PI * 20}
                                  strokeDashoffset={2 * Math.PI * 20 * (1 - pred.predicted_probability)}
                                />
                              </svg>
                              <span className="absolute text-[10px] font-black text-white">{probPct}%</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-6 italic">"{pred.reasoning}"</p>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${tagColor}`}>
                          {probPct >= 90 ? 'Critical' : 'High Focus'}
                        </span>
                        <button
                          onClick={() => handleToggleWeaknessTag(pred.topic_name)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            isWeakness
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {isWeakness ? '✓ Target Set' : '+ Set Target'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Predictions Pagination */}
            {predictions.length > predsPerPage && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                <span className="text-xs text-slate-400 font-medium">
                  Showing {(predCurrentPage - 1) * predsPerPage + 1} to {Math.min(predCurrentPage * predsPerPage, predictions.length)} of {predictions.length} topics
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={predCurrentPage === 1} 
                    onClick={() => setPredCurrentPage(p => p - 1)} 
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={predCurrentPage * predsPerPage >= predictions.length} 
                    onClick={() => setPredCurrentPage(p => p + 1)} 
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDY PLAN TAB */}
      {activeTab === 'studyplan' && (
        <div className="space-y-8 animate-fade-in">
          {/* Gamified Mastery Tracker (Header) */}
          {studyPlan.length > 0 && (() => {
            let totalTasks = 0;
            let completedCount = 0;
            studyPlan.forEach(plan => {
              plan.tasks.forEach((task, tIdx) => {
                totalTasks++;
                const taskKey = `${id}-${plan.day}-${tIdx}-${task.slice(0, 20)}`;
                if (completedTasks[taskKey]) completedCount++;
              });
            });

            const percent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
            let levelName = "Syllabus Initiate (Level 1)";
            let levelColor = "text-indigo-400";
            let progressBg = "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)]";
            let levelBadge = "Lvl 1";
            if (percent >= 75) {
              levelName = "GATE CS Master (Level 4) 🏆";
              levelColor = "text-emerald-400";
              progressBg = "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
              levelBadge = "Lvl 4";
            } else if (percent >= 50) {
              levelName = "Study Sage (Level 3) 🧙‍♂️";
              levelColor = "text-purple-400";
              progressBg = "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]";
              levelBadge = "Lvl 3";
            } else if (percent >= 25) {
              levelName = "Architect Apprentice (Level 2) 🛠️";
              levelColor = "text-amber-400";
              progressBg = "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]";
              levelBadge = "Lvl 2";
            }

            const currentXP = completedCount * 100;
            const totalXP = totalTasks * 100;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mastery Bar */}
                <div className="glass-panel p-6 bg-black/40 border border-white/5 rounded-2xl flex flex-col justify-between relative overflow-hidden lg:col-span-2">
                  <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Gamified Study Progress</span>
                    <h4 className="text-lg font-extrabold text-white mt-0.5 font-display">Syllabus Mastery Bar</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400 font-semibold">Current Title Rank:</span>
                      <span className={`text-xs font-black uppercase tracking-wider ${levelColor}`}>{levelName}</span>
                    </div>
                  </div>
                  
                  {/* Mastery progress bar */}
                  <div className="w-full bg-white/5 rounded-full h-5 mt-4 border border-white/10 relative overflow-hidden">
                    <div 
                      style={{ width: `${percent}%` }}
                      className={`h-full transition-all duration-500 ease-out ${progressBg}`}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">
                      {percent}% Completed ({completedCount} of {totalTasks} Tasks Mastered)
                    </span>
                  </div>
                </div>

                {/* Gamified Habit & XP Widgets */}
                <div className="grid grid-cols-2 gap-4 lg:col-span-1">
                  {/* XP Points card */}
                  <div className="glass-panel p-5 bg-[#191c2c]/40 border border-white/5 rounded-2xl flex flex-col justify-between text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">XP Rank Points</span>
                    <div className="my-2">
                      <span className="text-2xl font-black text-indigo-400">{currentXP}</span>
                      <span className="text-slate-500 text-xs"> / {totalXP} XP</span>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 bg-white/5 py-1 px-2 rounded-md block w-fit mx-auto">
                      🏆 {levelBadge} Badge
                    </span>
                  </div>

                  {/* Daily Streak Card */}
                  <div className="glass-panel p-5 bg-[#191c2c]/40 border border-white/5 rounded-2xl flex flex-col justify-between text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Study Streak</span>
                    <div className="my-2 flex items-center justify-center gap-1.5">
                      <span className="text-2xl font-black text-rose-400">🔥 {studyStreak}</span>
                      <span className="text-slate-400 text-xs font-bold">Days</span>
                    </div>
                    <span className="text-[8px] font-semibold text-amber-300 animate-pulse bg-amber-500/10 py-1 px-1 rounded block">
                      Daily Challenge: Active!
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Settings Customizer */}
          <div className="glass-panel p-6 bg-[#121420]/60 border border-white/5 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 font-display text-white">Study Plan Customizer</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Premium Time Horizon Customizer */}
              <div className="space-y-4 lg:col-span-1">
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-400">Study Duration</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(DURATION_PROFILES).map(([d, profile]) => {
                    const isSelected = String(studyPlanDays) === d;
                    return (
                      <div
                        key={d}
                        onClick={() => setStudyPlanDays(d)}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between h-32 ${
                          isSelected 
                            ? `bg-gradient-to-br ${profile.gradient} shadow-[0_0_15px_rgba(99,102,241,0.15)] scale-[1.02] border-indigo-500` 
                            : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/30 text-slate-400'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xl">{profile.icon}</span>
                          <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1 py-0.5 rounded bg-black/20 ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                            {profile.subtitle}
                          </span>
                        </div>
                        <div className="mt-2">
                          <strong className={`text-sm font-black block ${isSelected ? 'text-white' : 'text-slate-300'}`}>{profile.title}</strong>
                          <p className="text-[9px] leading-tight text-slate-500 mt-0.5 line-clamp-2">{profile.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between text-xs font-semibold text-slate-400">
                    <span>Custom Range Horizon</span>
                    <span className="text-indigo-400 font-extrabold">{studyPlanDays} Days Timeline</span>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="180"
                    value={studyPlanDays}
                    onChange={e => setStudyPlanDays(e.target.value)}
                    style={{
                      background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((studyPlanDays - 7) / (180 - 7)) * 100}%, rgba(255,255,255,0.05) ${((studyPlanDays - 7) / (180 - 7)) * 100}%, rgba(255,255,255,0.05) 100%)`
                    }}
                    className="w-full accent-indigo-500 h-1.5 rounded-lg appearance-none cursor-pointer border border-white/5"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    <span>7d sprint</span>
                    <span>30d standard</span>
                    <span>90d deep</span>
                    <span>180d master</span>
                  </div>
                </div>
              </div>

              {/* Targets and weakness presets */}
              <div className="space-y-4 lg:col-span-2">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-1.5">Target Weaknesses Focus</label>
                  <input 
                    type="text" 
                    value={studyPlanWeaknesses} 
                    onChange={e => setStudyPlanWeaknesses(e.target.value)} 
                    placeholder="e.g. Cache Mapping, SQL Transactions, Instruction Pipelining" 
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white w-full outline-none focus:border-indigo-500 text-sm font-medium transition-colors" 
                  />
                  
                  {/* Explanation card */}
                  <div className="text-[10px] text-indigo-300 leading-relaxed bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 mt-2 flex items-start gap-2">
                    <span className="text-xs shrink-0">💡</span>
                    <span>
                      <strong>Weakness Focus Tagging:</strong> Adding a topic prioritizes it in your roadmap. When you click <strong>Calculate Roadmap</strong>, the AI regression engine schedules study tasks and mock questions for these topics on the early days of your plan.
                    </span>
                  </div>
                </div>

                {/* Common topics preset buttons */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Preset High-Yield Topics (Click to add/remove)</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TOPICS_PRESETS.map(preset => {
                      const activeList = studyPlanWeaknesses.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                      const isActive = activeList.includes(preset.toLowerCase());
                      return (
                        <button
                          key={preset}
                          onClick={() => handleToggleWeaknessTag(preset)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300 shadow-sm shadow-indigo-500/10' 
                              : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsible taxonomy selector */}
                {examTopics && examTopics.length > 0 && (
                  <div className="border-t border-white/5 pt-4">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                      Browse Full Course Taxonomy Hierarchy (Click to toggle)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto bg-black/20 p-4 rounded-xl border border-white/5">
                      {examTopics.map(subject => {
                        const activeList = studyPlanWeaknesses.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                        const isSubjectActive = activeList.includes(subject.name.toLowerCase());
                        const isExpanded = !!weaknessExpandedSubjects[subject.id];
                        
                        return (
                          <div key={subject.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleWeaknessSubjectExpansion(subject.id)}
                                className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleWeaknessTag(subject.name)}
                                className={`text-[11px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer text-left flex-grow truncate ${
                                  isSubjectActive
                                    ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                                    : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/10'
                                }`}
                              >
                                {subject.name}
                              </button>
                            </div>
                            
                            {isExpanded && subject.subtopics && (
                              <div className="pl-5 space-y-1 border-l border-white/5 ml-2 mt-1">
                                {subject.subtopics.map(subtopic => {
                                  const isSubtopicActive = activeList.includes(subtopic.name.toLowerCase());
                                  return (
                                    <button
                                      key={subtopic.id}
                                      onClick={() => handleToggleWeaknessTag(subtopic.name)}
                                      className={`w-full text-left text-[10px] font-semibold px-2 py-0.5 rounded border transition-all cursor-pointer truncate ${
                                        isSubtopicActive
                                          ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                                          : 'bg-white/5 border-transparent text-slate-400 hover:border-white/10 hover:text-white'
                                      }`}
                                    >
                                      {subtopic.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-slate-400 leading-normal font-medium">
                {currentUser 
                  ? 'Update your weaknesses hierarchy and duration profile, then trigger roadmap calculations.' 
                  : '⚠️ Login to authorize and save study plan computations to your profile.'
                }
              </span>
              <button 
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-colors cursor-pointer flex items-center gap-2 h-[38px] disabled:opacity-50" 
                onClick={handleUpdateStudyPlan}
                disabled={!currentUser}
              >
                <Calendar size={15} /> Calculate Roadmap
              </button>
            </div>
          </div>

          {/* Timeline Redesigned Visual Interactive Roadmap */}
          <div className="relative border-l-2 border-slate-800 ml-4 md:ml-12 pl-6 md:pl-10 space-y-8 my-6">
            {studyPlan.length > 0 ? (() => {
              // Find the index of the first uncompleted phase
              let firstUncompletedIdx = -1;
              for (let pIdx = 0; pIdx < studyPlan.length; pIdx++) {
                const plan = studyPlan[pIdx];
                const allDone = plan.tasks.every((task, tIdx) => {
                  const taskKey = `${id}-${plan.day}-${tIdx}-${task.slice(0, 20)}`;
                  return completedTasks[taskKey];
                });
                if (!allDone) {
                  firstUncompletedIdx = pIdx;
                  break;
                }
              }

              return studyPlan.map((plan, i) => {
                const phaseTasks = plan.tasks;
                
                // Calculate phase completed count
                let phaseCompletedCount = 0;
                phaseTasks.forEach((task, tIdx) => {
                  const taskKey = `${id}-${plan.day}-${tIdx}-${task.slice(0, 20)}`;
                  if (completedTasks[taskKey]) phaseCompletedCount++;
                });
                
                const phaseCompleted = phaseCompletedCount === phaseTasks.length;
                const phasePercent = phaseTasks.length > 0 ? Math.round((phaseCompletedCount / phaseTasks.length) * 100) : 0;
                
                const isActiveQuest = (i === firstUncompletedIdx);
                
                let cardBorder = '';
                let nodeCircleStyle = '';
                let nodeIcon = null;

                if (phaseCompleted) {
                  cardBorder = 'border-emerald-500/20 bg-emerald-500/5 shadow-md shadow-emerald-950/10';
                  nodeCircleStyle = 'border-emerald-500 bg-emerald-950 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                  nodeIcon = <Check size={14} className="stroke-[3]" />;
                } else if (isActiveQuest) {
                  cardBorder = 'border-indigo-500/30 bg-indigo-500/5 shadow-lg shadow-indigo-950/20';
                  nodeCircleStyle = 'border-indigo-500 bg-indigo-950 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]';
                  nodeIcon = <Play size={10} className="fill-indigo-400 stroke-none ml-0.5" />;
                } else {
                  cardBorder = 'border-white/5 bg-[#191c2c]/10 opacity-75';
                  nodeCircleStyle = 'border-slate-700 bg-slate-900 text-slate-500';
                  nodeIcon = <Lock size={10} />;
                }

                const isLocked = firstUncompletedIdx !== -1 && i > firstUncompletedIdx;

                return (
                  <div key={i} className="relative group">
                    {/* Timeline Node Circle */}
                    <div className={`absolute -left-[39px] md:-left-[55px] top-6 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300 ${nodeCircleStyle}`}>
                      {nodeIcon}
                    </div>

                    <div className={`p-6 rounded-2xl transition-all duration-300 border ${cardBorder} hover:scale-[1.005]`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md uppercase tracking-wider">
                              Day {plan.day}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold bg-white/5 py-0.5 px-2 rounded-md">
                              {plan.time}
                            </span>
                            {phaseCompleted && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Completed
                              </span>
                            )}
                            {isActiveQuest && (
                              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                                Active Focus
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-bold text-white mt-1.5">{plan.title}</h4>
                        </div>

                        {/* Phase Progress Bar */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold text-slate-400">Completion</span>
                          <div className="w-32 bg-white/5 rounded-full h-2 border border-white/5 relative overflow-hidden">
                            <div 
                              style={{ width: `${phasePercent}%` }} 
                              className={`h-full transition-all duration-300 ${phaseCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            ></div>
                          </div>
                          <span className="text-xs font-black text-slate-300 w-8 text-right">{phasePercent}%</span>
                        </div>
                      </div>

                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {plan.tasks.map((task, tIdx) => {
                          const taskKey = `${id}-${plan.day}-${tIdx}-${task.slice(0, 20)}`;
                          const checked = !!completedTasks[taskKey];
                          return (
                            <li 
                              key={tIdx} 
                              onClick={() => {
                                if (isLocked) {
                                  if (addToast) {
                                    addToast("This day's tasks are locked! Complete previous day tasks first.", "warning");
                                  } else {
                                    alert("This day's tasks are locked! Complete previous day tasks first.");
                                  }
                                  return;
                                }
                                handleToggleTask(taskKey);
                              }}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                checked 
                                  ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-500 line-through' 
                                  : 'bg-white/5 border-white/5 text-slate-200 hover:border-white/10'
                              }`}
                            >
                              <input 
                                type="checkbox" 
                                checked={checked}
                                readOnly
                                className="mt-0.5 shrink-0 rounded border-white/10 text-indigo-600 focus:ring-indigo-500" 
                              />
                              <span className="text-xs font-semibold leading-relaxed">{task}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                );
              });
            })() : <p className="text-center text-slate-400 py-6">No study roadmap scheduled.</p>}
          </div>
        </div>
      )}

      {/* GAP RADAR TAB */}
      {activeTab === 'gapradar' && (
        <GapRadar examId={id} />
      )}

      {/* QUESTIONS TAB */}
      {activeTab === 'questions' && (
        <div className="glass-panel p-6 bg-[#121420]/60 animate-fade-in border border-white/5">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4 border-b border-white/5 pb-6">
            <h3 className="text-xl font-bold">Historical Question Explorer</h3>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold">{questions.length} Questions</span>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex-grow bg-black/40 border border-white/10 rounded-xl flex items-center px-3 focus-within:border-indigo-500/50 transition-colors">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                value={questionSearch} 
                onChange={e => setQuestionSearch(e.target.value)} 
                placeholder="Search questions by keyword..." 
                className="bg-transparent border-none text-white w-full py-2.5 px-3 focus:outline-none text-sm font-medium" 
              />
            </div>
            <select 
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 text-sm font-semibold transition-colors" 
              value={selectedPaper?.id || ''} 
              onChange={e => {
                const val = e.target.value;
                setSelectedPaper(val ? papers.find(p => p.id === parseInt(val)) : null);
              }}
            >
              <option value="">All Papers</option>
              {papers.map(p => <option key={p.id} value={p.id}>GATE CS {p.year}</option>)}
            </select>
          </div>

          <div className="space-y-6">
            {questions.length === 0 ? (
              <p className="text-center text-slate-400 py-10 font-semibold">No questions found matching your filter rules.</p>
            ) : (
              questions.slice((currentPage - 1) * questionsPerPage, currentPage * questionsPerPage).map((q, idx) => (
                <div key={q.id}>
                  <QuestionCard 
                    q={q} 
                    selectedPaper={selectedPaper}
                    qNumber={q.question_number}
                    onAskMentor={handleAskMentor}
                  />
                  <div className="px-5 pb-5 -mt-3">
                    <QuestionFeedback questionId={q.id} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Question Explorer Pagination */}
          {questions.length > questionsPerPage && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
              <span className="text-xs text-slate-400 font-medium">
                Showing {(currentPage - 1) * questionsPerPage + 1} to {Math.min(currentPage * questionsPerPage, questions.length)} of {questions.length} questions
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)} 
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                >
                  Prev
                </button>
                <button 
                  disabled={currentPage * questionsPerPage >= questions.length} 
                  onClick={() => setCurrentPage(p => p + 1)} 
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Mentor Chatbot */}
      <WeaknessChatbot 
        isOpen={mentorChatOpen} 
        onClose={() => setMentorChatOpen(false)} 
        question={mentorQuestion} 
        onXpEarned={(xp) => {
          if (addToast) {
            addToast(`Earned +${xp} XP from AI Syllabus Mentor!`, 'success');
          }
        }}
      />

      {/* Confetti & Study Completion Celebration Modal */}
      {showCompletionModal && (
        <>
          <Confetti />
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4 overflow-y-auto print:p-0">
            <div className="bg-[#0f1219] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl relative my-8 print-certificate-area">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .print-certificate-area, .print-certificate-area * {
                    visibility: visible;
                  }
                  .print-certificate-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100vw;
                    height: 100vh;
                    margin: 0;
                    padding: 40px;
                    background: #0f1219 !important;
                    color: #ffffff !important;
                    border: none !important;
                  }
                  .print-certificate-btn-container {
                    display: none !important;
                  }
                }
              `}</style>
              
              {/* Modal Close Button (not printed) */}
              <button 
                onClick={() => setShowCompletionModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors print-certificate-btn-container z-20 cursor-pointer"
              >
                <XCircle size={22} />
              </button>

              <div className="p-8 md:p-12 text-center flex flex-col items-center">
                {/* Ribbon badge */}
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mb-6 animate-bounce">
                  <Award size={42} className="text-amber-400" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 font-display uppercase tracking-wider mb-2">
                  Certificate of Achievement
                </h2>
                <p className="text-slate-400 text-xs tracking-widest uppercase font-bold mb-8">GATE CS Syllabus Mastery</p>
                
                <div className="w-full border-t border-b border-white/5 py-8 my-2 space-y-4">
                  <p className="text-slate-400 text-sm italic font-medium">This is proudly presented to</p>
                  
                  {/* Name field (Interactive & customizable) */}
                  <div className="max-w-md mx-auto print-certificate-btn-container">
                    <input 
                      type="text" 
                      value={certName}
                      onChange={e => setCertName(e.target.value)}
                      className="text-2xl md:text-3xl font-black text-white text-center bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none w-full pb-2 font-display"
                      placeholder="Enter Your Name"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Click to edit name on certificate</span>
                  </div>
                  
                  {/* Print-only static name */}
                  <div className="hidden print:block text-3xl font-black text-white font-display">
                    {certName}
                  </div>

                  <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
                    for demonstrating complete diligence and mastering 100% of the structured preparation timeline, conquering all predictive targets and syllabus domains.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-8 w-full max-w-md mt-6 text-left">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Date of Completion</span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Authorized Issuer</span>
                    <span className="text-sm font-bold text-indigo-400 mt-1 block font-display">ExamArchitect AI</span>
                  </div>
                </div>

                {/* Print and Claim Buttons */}
                <div className="flex gap-4 mt-10 print-certificate-btn-container">
                  <button 
                    onClick={() => window.print()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    <Printer size={14} /> Print Certificate
                  </button>
                  <button 
                    onClick={() => {
                      setShowCompletionModal(false);
                      if (addToast) {
                        addToast("Certificate claimed! 5000 XP credited to your local profile.", "success");
                      }
                    }}
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-xs py-3 px-6 rounded-xl transition-colors cursor-pointer"
                  >
                    Close Celebration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
