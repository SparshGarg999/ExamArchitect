import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Cpu, 
  Activity, 
  BookOpen, 
  BarChart3, 
  Layers, 
  Settings, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  Calendar, 
  ListTodo,
  TrendingUp,
  AlertTriangle,
  Flame,
  Search,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Image,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';
import AdminPanel from './components/AdminPanel';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = 'http://localhost:8000';

// ============= Helper to parse MCQ Options =============
function parseOptions(text) {
  if (!text) return null;
  
  // Regex to match options like (A) ... (B) ...
  const mcqPattern = /(?:\(|\s|^)([A-D])\)(?:\s+|:)([\s\S]*?)(?=\s*(?:\(|^[A-D]\)|[A-D]\s*[\.):]|$))/g;
  const matches = [...text.matchAll(mcqPattern)];
  if (matches.length > 0) {
    const options = matches.map(m => ({
      label: m[1],
      text: m[2].trim()
    }));
    const firstOptionIdx = text.search(/(?:\(|\s|^)[A-D]\)(?:\s+|:)/);
    const cleanText = firstOptionIdx !== -1 ? text.substring(0, firstOptionIdx).trim() : text;
    return { cleanText, options };
  }

  // Regex to match options like A. ... B. ...
  const dotPattern = /(?:\s|^)([A-D])\.(?:\s+|:)([\s\S]*?)(?=\s*(?:^[A-D]\.|[A-D]\s*[\.):]|$))/g;
  const matchesDot = [...text.matchAll(dotPattern)];
  if (matchesDot.length > 0) {
    const options = matchesDot.map(m => ({
      label: m[1],
      text: m[2].trim()
    }));
    const firstOptionIdx = text.search(/(?:\s|^)[A-D]\.(?:\s+|:)/);
    const cleanText = firstOptionIdx !== -1 ? text.substring(0, firstOptionIdx).trim() : text;
    return { cleanText, options };
  }

  return null;
}

// ============= Helper to generate Fallback study roadmap =============
function getFallbackPlan(days) {
  const blocks = Math.min(4, days);
  if (blocks <= 0) return [];
  const daysPerBlock = Math.floor(days / blocks);
  const extraDays = days % blocks;
  const topics = [
    { name: 'Discrete Mathematics', tasks: ['Master Mathematical Logic & Set Theory basics', 'Solve Graph Theory & Combinatorics problems'] },
    { name: 'Computer Organization & Architecture', tasks: ['Revise Cache Memory hierarchy & mapping', 'Practice Instruction Pipelining numeric problems'] },
    { name: 'Programming & Algorithms', tasks: ['Practice Recursion tree analysis & time complexity', 'Review Searching, Sorting & Hashing rules'] },
    { name: 'Operating Systems & Databases', tasks: ['Solve CPU Scheduling & Semaphore sync problems', 'Revise Relational Algebra & SQL queries'] }
  ];
  
  let currentDay = 1;
  return Array.from({ length: blocks }).map((_, i) => {
    const blockDays = daysPerBlock + (i < extraDays ? 1 : 0);
    const startDay = currentDay;
    const endDay = currentDay + blockDays - 1;
    currentDay = endDay + 1;
    
    return {
      day: startDay === endDay ? `Day ${startDay}` : `Days ${startDay}-${endDay}`,
      title: `Core Focus: ${topics[i % topics.length].name}`,
      tasks: topics[i % topics.length].tasks,
      time: `${blockDays * 4} Hrs Study`
    };
  });
}

// ============= Toast Notification Component =============
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`} onClick={() => onDismiss(toast.id)}>
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.type === 'error' && <AlertTriangle size={16} />}
          {toast.type === 'info' && <RefreshCw size={16} />}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

// ============= Answer Spoiler Component =============
function AnswerSpoiler({ answer }) {
  const [open, setOpen] = useState(false);
  if (!answer) return null;
  return (
    <div className="answer-spoiler">
      <button className={`answer-spoiler-toggle ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        <ChevronRight size={14} />
        {open ? 'Hide Answer' : 'Show Answer'}
      </button>
      {open && (
        <div className="answer-spoiler-content">
          Correct Answer: {answer}
        </div>
      )}
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'admin'
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [activeTab, setActiveTab] = useState('heatmap'); // heatmap, predictions, studyplan, questions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Exam-specific states
  const [heatmapData, setHeatmapData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null); // null means "All Papers"
  const [questions, setQuestions] = useState([]);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('');

  // Study plan and trend states
  const [studyPlanDays, setStudyPlanDays] = useState(30);
  const [studyPlan, setStudyPlan] = useState([]);
  const [studyPlanWeaknesses, setStudyPlanWeaknesses] = useState('');
  const [selectedHeatmapTopic, setSelectedHeatmapTopic] = useState(null);

  // Heatmap accordion drilldown states
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [subtopicHeatmaps, setSubtopicHeatmaps] = useState({});

  // Question browser states
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState('');
  const [examTopics, setExamTopics] = useState([]);

  const topicDetailsRef = useRef(null);

  useEffect(() => {
    if (selectedHeatmapTopic && topicDetailsRef.current) {
      topicDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedHeatmapTopic]);

  // Fetch Categories on Mount
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

  // Fetch Exams when Category is selected
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

  // Fetch Exam Dashboard Data when Exam is selected
  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    setLoading(true);
    
    Promise.all([
      fetch(`${API_BASE}/api/exams/${exam.id}/heatmap`).then(res => res.json()),
      fetch(`${API_BASE}/api/exams/${exam.id}/predictions`).then(res => res.json()),
      fetch(`${API_BASE}/api/exams/${exam.id}/papers`).then(res => res.json()),
      fetch(`${API_BASE}/api/exams/${exam.id}/study-plan?total_days=30`).then(res => res.json()),
      fetch(`${API_BASE}/api/exams/${exam.id}/topics`).then(res => res.json())
    ])
    .then(([heatmap, preds, papersData, plan, topics]) => {
      setHeatmapData(heatmap);
      setPredictions(preds);
      setPapers(papersData);
      setStudyPlan(plan);
      setExamTopics(topics);
      // Default to "All Papers" instead of pre-selecting the first year, for a better global search UX
      setSelectedPaper(null);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setHeatmapData({ years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], data: [] });
      setPredictions([]);
      setPapers([]);
      setStudyPlan([]);
      setExamTopics([]);
      setSelectedPaper(null);
      setLoading(false);
    });
  };

  const handleUpdateStudyPlan = (days, weaknesses) => {
    if (!selectedExam) return;
    const body = {
      total_days: parseInt(days) || 30,
      weakness_topics: weaknesses ? weaknesses.split(',').map(s => s.trim()).filter(Boolean) : null
    };
    fetch(`${API_BASE}/api/exams/${selectedExam.id}/study-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setStudyPlan(data);
        } else {
          // If the backend returns empty because there are no predictions, generatefallback
          setStudyPlan(getFallbackPlan(days));
        }
      })
      .catch(err => {
        console.error('Failed to update study plan, using local generator:', err);
        setStudyPlan(getFallbackPlan(days));
      });
  };

  // Weakness Toggle Handler
  const handleToggleWeakness = (topicName) => {
    let list = studyPlanWeaknesses.split(',').map(s => s.trim()).filter(Boolean);
    if (list.includes(topicName)) {
      list = list.filter(item => item !== topicName);
    } else {
      list.push(topicName);
    }
    setStudyPlanWeaknesses(list.join(', '));
  };

  // Fetch questions: uses /api/questions if paper is null (All Papers), else /api/papers/{paper_id}/questions
  const fetchQuestionsList = useCallback(() => {
    const params = new URLSearchParams();
    if (questionSearch.trim()) params.set('search', questionSearch.trim());
    if (questionSubjectFilter) params.set('subject_id', questionSubjectFilter);
    const queryStr = params.toString() ? `?${params.toString()}` : '';

    let url = '';
    if (selectedPaper) {
      url = `${API_BASE}/api/papers/${selectedPaper.id}/questions${queryStr}`;
    } else {
      url = `${API_BASE}/api/questions${queryStr}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error(err));
  }, [selectedPaper, questionSubjectFilter, questionSearch]);

  // Trigger fetch when paper or subject filters change
  useEffect(() => {
    fetchQuestionsList();
  }, [selectedPaper, questionSubjectFilter]);

  // Debounced search for questions
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestionsList();
    }, 300);
    return () => clearTimeout(timer);
  }, [questionSearch]);

  // Handle heatmap subject expand/collapse
  const handleToggleSubject = (subjectRow) => {
    const subjectId = subjectRow.id;
    const isCurrentlyExpanded = expandedSubjects[subjectId];

    if (isCurrentlyExpanded) {
      setExpandedSubjects(prev => ({ ...prev, [subjectId]: false }));
    } else {
      setExpandedSubjects(prev => ({ ...prev, [subjectId]: true }));
      if (!subtopicHeatmaps[subjectId] && selectedExam) {
        fetch(`${API_BASE}/api/exams/${selectedExam.id}/topics/${subjectId}/heatmap`)
          .then(res => res.json())
          .then(data => {
            setSubtopicHeatmaps(prev => ({ ...prev, [subjectId]: data }));
          })
          .catch(err => console.error('Failed to fetch subtopic heatmap:', err));
      }
    }
  };

  // Handle re-seed button
  const handleReseed = () => {
    if (seeding) return;
    setSeeding(true);
    addToast('Seeding 10 years of historical data with realistic option details...', 'info');
    fetch(`${API_BASE}/api/ingest/bulk`, { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setSeeding(false);
        addToast(`Successfully seeded ${data.questions_ingested} questions across ${data.papers_added_or_verified} years!`, 'success');
        handleSelectExam(selectedExam);
      })
      .catch(err => {
        setSeeding(false);
        addToast(`Failed to seed data: ${err.message}`, 'error');
        console.error(err);
      });
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setExams([]);
  };

  const handleBackToExams = () => {
    setSelectedExam(null);
    setHeatmapData(null);
    setPredictions([]);
    setPapers([]);
    setSelectedPaper(null);
    setQuestions([]);
    setExpandedSubjects({});
    setSubtopicHeatmaps({});
    setExamTopics([]);
  };

  const trendChartData = (selectedHeatmapTopic && heatmapData) ? {
    labels: heatmapData.years.length > 0 ? heatmapData.years : [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    datasets: [
      {
        label: `${selectedHeatmapTopic.name} (Marks Weight)`,
        data: (heatmapData.years.length > 0 ? heatmapData.years : [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]).map(y => {
          const yearData = selectedHeatmapTopic.years[y] || selectedHeatmapTopic.years[String(y)];
          if (typeof yearData === 'object' && yearData !== null) return yearData.total_marks || 0;
          return yearData || 0;
        }),
        fill: true,
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Subtle red transparent fill
        borderColor: 'rgba(239, 68, 68, 1)', // Red border
        borderWidth: 2,
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(239, 68, 68, 1)',
        tension: 0.35,
      }
    ]
  } : null;

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 20, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        padding: 12,
        bodyFont: { family: 'Outfit' },
        titleFont: { family: 'Outfit', weight: 'bold' }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year of Exam',
          color: '#cbd5e1',
          font: { family: 'Outfit', size: 10, weight: 'bold' }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 10 }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Marks Weightage',
          color: '#cbd5e1',
          font: { family: 'Outfit', size: 10, weight: 'bold' }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 10 },
          callback: (value) => `${value}m`
        },
        suggestedMin: 0,
        suggestedMax: 15
      }
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p>Analyzing Architectures...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'admin') {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <AdminPanel onNavigate={setCurrentView} apiBaseUrl={API_BASE} addToast={addToast} />
      </>
    );
  }

  // Helper: render a heatmap cell using a premium red-orange heatmap gradient
  const renderHeatmapCell = (marks, key) => {
    const maxMark = 16;
    const pct = Math.min(1, marks / maxMark);
    
    let bgIntensity = 'rgba(255,255,255,0.02)';
    let textColor = 'var(--text-secondary)';
    let extraStyles = {};
    
    if (marks > 0) {
      if (marks <= 3) {
        // Low: Amber / yellow gradient
        bgIntensity = `rgba(251, 191, 36, ${0.15 + (marks/3) * 0.25})`;
      } else if (marks <= 7) {
        // Medium: Orange gradient
        bgIntensity = `rgba(249, 115, 22, ${0.4 + ((marks-3)/4) * 0.3})`;
        textColor = '#ffffff';
      } else {
        // Critical: Red/coral gradient
        bgIntensity = `rgba(239, 68, 68, ${0.7 + ((marks-7)/9) * 0.25})`;
        textColor = '#ffffff';
        extraStyles = {
          border: '1.5px solid rgba(239, 68, 68, 0.9)',
          textShadow: '0 0 3px rgba(239, 68, 68, 0.8)',
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
          animation: 'pulseGlow 2s infinite alternate'
        };
      }
    }
    
    return (
      <div 
        key={key} 
        style={{ 
          backgroundColor: bgIntensity, 
          color: textColor,
          padding: '6px 2px', 
          borderRadius: '4px', 
          fontWeight: 'bold', 
          textAlign: 'center',
          fontSize: '0.75rem',
          border: '1px solid rgba(255,255,255,0.02)',
          ...extraStyles
        }}
      >
        {marks > 0 ? `${marks.toFixed(0)}m` : '0m'}
      </div>
    );
  };

  return (
    <div className="container animate-fade-in">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <header className="app-header">
        <a href="/" className="logo" onClick={(e) => { e.preventDefault(); handleBackToExams(); handleBackToCategories(); }}>
          <div className="logo-icon">EA</div>
          <span>Exam<span className="text-gradient">Architect</span></span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            <span>GATE CS Module Seeding Active</span>
          </div>
          <button 
            className="glass-panel" 
            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', borderColor: 'rgba(99, 102, 241, 0.3)', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'white' }}
            onClick={() => setCurrentView('admin')}
          >
            <ShieldAlert size={14} /> Admin Console
          </button>
        </div>
      </header>

      {error && (
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', borderColor: 'var(--accent-rose)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertTriangle color="var(--accent-rose)" />
          <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {/* VIEW 1: Category Selector */}
      {!selectedCategory && (
        <>
          <div className="hero">
            <h1>Statistical Exam Analytics <br /><span className="text-gradient">Engineered to Predict.</span></h1>
            <p>We analyze 10 years of past papers using a rigorous mathematical prediction engine combined with Gemini's taxonomy tagging to build your ultimate study roadmap.</p>
          </div>

          <div className="category-section">
            <h2 className="section-title"><Layers size={20} color="var(--accent-indigo)" /> Choose Your Discipline</h2>
            <div className="category-grid">
              {categories.map(cat => (
                <div key={cat.id} className="glass-panel category-card glass-card animate-fade-in" onClick={() => handleSelectCategory(cat)}>
                  <div className="category-icon-wrapper" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                    <Cpu size={24} />
                  </div>
                  <h3>{cat.name}</h3>
                  <p>{cat.description}</p>
                  <div className="category-footer">
                    <span className="category-exams-count">{cat.exam_count} {cat.exam_count === 1 ? 'Exam' : 'Exams'} Available</span>
                    <span className="category-action">Browse <ArrowRight size={14} /></span>
                  </div>
                </div>
              ))}
              
              <div className="glass-panel category-card" style={{ opacity: 0.5, cursor: 'not-allowed', borderStyle: 'dashed' }}>
                <div className="category-icon-wrapper" style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
                  <HelpCircle size={24} />
                </div>
                <h3>Medical & UPSC</h3>
                <p>Curating 10-year patterns for NEET, JEE Main, and Civil Services. Coming soon.</p>
                <div className="category-footer">
                  <span className="category-exams-count" style={{ color: 'var(--accent-rose)' }}>Locked Phase 5</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: Exam Selector in Category */}
      {selectedCategory && !selectedExam && (
        <div className="animate-fade-in">
          <button className="back-button" onClick={handleBackToCategories}>
            <ChevronLeft size={16} /> Back to Disciplines
          </button>
          
          <div className="hero" style={{ marginBottom: '32px', textAlign: 'left', marginLeft: '0', maxWidth: '100%' }}>
            <h2>Available Exams in <span style={{ color: selectedCategory.color }}>{selectedCategory.name}</span></h2>
            <p>Select an exam to load its topic-pairing heatmap and predictive trends dashboard.</p>
          </div>

          <div className="exam-list">
            {exams.map(exam => (
              <div key={exam.id} className="exam-row" onClick={() => handleSelectExam(exam)}>
                <div className="exam-info">
                  <h4>{exam.full_name} ({exam.name})</h4>
                  <div className="exam-meta">
                    <span><strong>Frequency:</strong> {exam.frequency}</span>
                    <span>•</span>
                    <span><strong>Body:</strong> {exam.conducting_body}</span>
                  </div>
                </div>
                <button className="exam-action">Enter Dashboard</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: Main Exam Analytics Dashboard */}
      {selectedExam && (
        <div className="animate-fade-in">
          {/* Dashboard Header Banner */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', borderLeft: `4px solid var(--accent-indigo)`, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '20px', alignItems: 'center' }}>
            <div>
              <button className="back-button" style={{ marginBottom: '8px' }} onClick={handleBackToExams}>
                <ChevronLeft size={16} /> Choose Exam
              </button>
              <h2 style={{ fontSize: '1.75rem' }}>{selectedExam.full_name} Dashboard</h2>
              <p style={{ fontSize: '0.9rem' }}>Pre-seeded Ingestion: 10 Years (2015-2025) • Prediction Model: Statistical v5</p>
            </div>
            
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Database Papers</span>
                <strong style={{ fontSize: '1.5rem', color: 'var(--accent-indigo)' }}>{papers.length} Years</strong>
              </div>
              <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }}></div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Confidence</span>
                <strong style={{ fontSize: '1.5rem', color: 'var(--accent-emerald)' }}>94.2%</strong>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
            <button 
              className={`btn-secondary ${activeTab === 'heatmap' ? 'glass-panel' : ''}`}
              style={{ background: activeTab === 'heatmap' ? 'rgba(99,102,241,0.1)' : 'transparent', borderColor: activeTab === 'heatmap' ? 'rgba(99,102,241,0.3)' : 'transparent', color: activeTab === 'heatmap' ? 'white' : 'var(--text-secondary)', padding: '10px 20px', fontSize: '0.9rem', borderRadius: '8px 8px 0 0' }}
              onClick={() => setActiveTab('heatmap')}
            >
              <BarChart3 size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} /> Topic Heatmap
            </button>
            <button 
              className={`btn-secondary ${activeTab === 'predictions' ? 'glass-panel' : ''}`}
              style={{ background: activeTab === 'predictions' ? 'rgba(99,102,241,0.1)' : 'transparent', borderColor: activeTab === 'predictions' ? 'rgba(99,102,241,0.3)' : 'transparent', color: activeTab === 'predictions' ? 'white' : 'var(--text-secondary)', padding: '10px 20px', fontSize: '0.9rem', borderRadius: '8px 8px 0 0' }}
              onClick={() => setActiveTab('predictions')}
            >
              <TrendingUp size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} /> AI Predictions
            </button>
            <button 
              className={`btn-secondary ${activeTab === 'studyplan' ? 'glass-panel' : ''}`}
              style={{ background: activeTab === 'studyplan' ? 'rgba(99,102,241,0.1)' : 'transparent', borderColor: activeTab === 'studyplan' ? 'rgba(99,102,241,0.3)' : 'transparent', color: activeTab === 'studyplan' ? 'white' : 'var(--text-secondary)', padding: '10px 20px', fontSize: '0.9rem', borderRadius: '8px 8px 0 0' }}
              onClick={() => setActiveTab('studyplan')}
            >
              <ListTodo size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} /> Dynamic Study Plan
            </button>
            <button 
              className={`btn-secondary ${activeTab === 'questions' ? 'glass-panel' : ''}`}
              style={{ background: activeTab === 'questions' ? 'rgba(99,102,241,0.1)' : 'transparent', borderColor: activeTab === 'questions' ? 'rgba(99,102,241,0.3)' : 'transparent', color: activeTab === 'questions' ? 'white' : 'var(--text-secondary)', padding: '10px 20px', fontSize: '0.9rem', borderRadius: '8px 8px 0 0' }}
              onClick={() => setActiveTab('questions')}
            >
              <BookOpen size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} /> Question Browser
            </button>
          </div>

          {/* TAB 1: Heatmap Display with Accordion Drilldown */}
          {activeTab === 'heatmap' && (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Decadal Topic Heatmap</h3>
                  <p style={{ fontSize: '0.85rem' }}>Click any subject to expand and see topic-level breakdowns. Visualizing absolute mark weight distributions over the last 10 years.</p>
                </div>
                <button 
                  className="seed-btn"
                  disabled={seeding}
                  onClick={handleReseed}
                >
                  {seeding ? (
                    <>
                      <span className="btn-spinner"></span>
                      Seeding...
                    </>
                  ) : (
                    (!heatmapData || !heatmapData.data || heatmapData.data.length === 0) ? "Instantly Seed 10-Yr Heatmap" : "Reset & Re-seed 10-Yr Data"
                  )}
                </button>
              </div>

              {/* Statistical Heatmap with accordion drilldown */}
              <div className="heatmap-container">
                <div style={{ border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '16px', background: 'rgba(25, 28, 44, 0.2)', overflowX: 'auto' }}>
                  {(!heatmapData || !heatmapData.data || heatmapData.data.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No heatmap data available. Press the button above to ingest historical papers.
                    </div>
                  ) : (() => {
                    const years = heatmapData.years.length > 0 ? heatmapData.years : [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
                    
                    const parentTopicMap = {};
                    heatmapData.data.forEach(t => {
                      if (!t.parent_id) {
                        parentTopicMap[t.id] = { id: t.id, name: t.name, years: {} };
                        years.forEach(y => { parentTopicMap[t.id].years[y] = 0; });
                      }
                    });

                    if (Object.keys(parentTopicMap).length === 0) {
                      heatmapData.data.forEach(t => {
                        parentTopicMap[t.id] = { id: t.id, name: t.name, years: {} };
                        years.forEach(y => { parentTopicMap[t.id].years[y] = 0; });
                      });
                    }

                    heatmapData.data.forEach(t => {
                      const parentId = t.parent_id || t.id;
                      if (parentTopicMap[parentId]) {
                        Object.entries(t.years || {}).forEach(([year, yearData]) => {
                          parentTopicMap[parentId].years[year] = (parentTopicMap[parentId].years[year] || 0) + (yearData.total_marks || 0);
                        });
                      }
                    });

                    return (
                      <>
                        {/* Header Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: `240px repeat(${years.length}, 1fr)`, gap: '4px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', minWidth: '800px' }}>
                          <div style={{ textAlign: 'left' }}>Subject / Subtopic</div>
                          {years.map(year => (
                            <div key={year}>{year}</div>
                          ))}
                        </div>

                        {/* Subject Rows with Accordion */}
                        {Object.values(parentTopicMap).map((row, idx) => {
                          const isExpanded = expandedSubjects[row.id];
                          const subtopicData = subtopicHeatmaps[row.id];
                          
                          return (
                            <React.Fragment key={idx}>
                              {/* Parent Subject Row */}
                              <div 
                                className="heatmap-subject-row"
                                onClick={() => handleToggleSubject(row)}
                                style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: `240px repeat(${years.length}, 1fr)`, 
                                  gap: '4px', 
                                  alignItems: 'center', 
                                  fontSize: '0.8rem', 
                                  padding: '8px 12px', 
                                  borderBottom: '1px solid rgba(255,255,255,0.02)', 
                                  minWidth: '800px',
                                  backgroundColor: selectedHeatmapTopic?.id === row.id ? 'rgba(239, 68, 68, 0.08)' : isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                                }}
                              >
                                <div style={{ textAlign: 'left', fontWeight: '600', color: isExpanded ? 'var(--accent-indigo)' : 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className={`heatmap-expand-icon ${isExpanded ? 'expanded' : ''}`}>
                                    <ChevronRight size={14} />
                                  </span>
                                  {row.name}
                                </div>
                                {years.map((year, yIdx) => {
                                  const marks = row.years[year] || 0;
                                  return renderHeatmapCell(marks, yIdx);
                                })}
                              </div>

                              {/* Subtopic Rows (Accordion) */}
                              {isExpanded && (
                                <div className="heatmap-subtopic-container" style={{ maxHeight: isExpanded ? '1000px' : '0', opacity: isExpanded ? 1 : 0 }}>
                                  {subtopicData ? (
                                    subtopicData.subtopics.map((sub, sIdx) => (
                                      <div 
                                        key={sIdx}
                                        className="heatmap-subtopic-row"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedHeatmapTopic(sub);
                                        }}
                                        style={{ 
                                          display: 'grid', 
                                          gridTemplateColumns: `240px repeat(${years.length}, 1fr)`, 
                                          gap: '4px', 
                                          alignItems: 'center', 
                                          fontSize: '0.78rem', 
                                          padding: '6px 12px', 
                                          borderBottom: '1px solid rgba(255,255,255,0.01)', 
                                          minWidth: '800px',
                                          backgroundColor: selectedHeatmapTopic?.id === sub.id ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                        }}
                                      >
                                        <div className="subtopic-name">
                                          {sub.name}
                                        </div>
                                        {years.map((year, yIdx) => {
                                          const yearData = sub.years[String(year)];
                                          const marks = yearData ? yearData.total_marks : 0;
                                          return renderHeatmapCell(marks, yIdx);
                                        })}
                                      </div>
                                    ))
                                  ) : (
                                    <div style={{ padding: '12px 24px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span className="btn-spinner"></span> Loading subtopics...
                                    </div>
                                  )}
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Legend */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: '600' }}>Weight Density:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(251, 191, 36, 0.25)' }}></span> Low Weight (1-3m)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(249, 115, 22, 0.6)' }}></span> Medium Weight (4-7m)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(239, 68, 68, 0.9)' }}></span> Critical Weight (&gt;7m)</span>
              </div>

              {/* Improved Dynamic Line Chart Trend Visualization (Two-column layout) */}
              {selectedHeatmapTopic && (
                <div ref={topicDetailsRef} className="selected-topic-details-grid animate-fade-in">
                  {/* Left Column: Summary Info */}
                  <div className="topic-info-card">
                    <div className="topic-info-header">
                      <span className="badge">Topic Focus</span>
                      <h4>{selectedHeatmapTopic.name}</h4>
                    </div>

                    <div className="topic-info-stats">
                      <div className="topic-info-stat-box">
                        <span>Max Recorded Weight</span>
                        <strong>
                          {(() => {
                            const values = Object.values(selectedHeatmapTopic.years).map(y => typeof y === 'object' ? y.total_marks : y);
                            return values.length > 0 ? `${Math.max(...values).toFixed(1)}m` : 'N/A';
                          })()}
                        </strong>
                      </div>
                      <div className="topic-info-stat-box">
                        <span>Avg Difficulty Trend</span>
                        <strong style={{ color: 'var(--accent-amber)' }}>
                          {(() => {
                            const values = Object.values(selectedHeatmapTopic.years).map(y => typeof y === 'object' ? y.avg_difficulty : 2).filter(Boolean);
                            const avg = values.length > 0 ? values.reduce((a,b) => a+b, 0) / values.length : 2.0;
                            return avg > 2.3 ? 'Hard' : avg > 1.6 ? 'Medium' : 'Easy';
                          })()}
                        </strong>
                      </div>
                    </div>

                    <div className="topic-info-recommendation">
                      <strong>AI Study Guidance:</strong> This topic is highly critical for score optimization. Practice core numerical formulas and solve past questions from high-weight years highlighted in red.
                    </div>

                    <button 
                      className="primary-btn" 
                      style={{ padding: '8px 12px', fontSize: '0.8rem', marginTop: '16px', width: 'fit-content' }}
                      onClick={() => handleToggleWeakness(selectedHeatmapTopic.name)}
                    >
                      Toggle in Weakness List
                    </button>
                  </div>

                  {/* Right Column: Chart */}
                  <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', color: 'white', fontWeight: 'bold' }}>Historical Weightage Trend (2015-2025)</h4>
                      </div>
                      <button 
                        className="glass-panel" 
                        style={{ padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', color: 'white', backgroundColor: 'rgba(255,255,255,0.03)' }} 
                        onClick={() => setSelectedHeatmapTopic(null)}
                      >
                        Close Details
                      </button>
                    </div>
                    <div style={{ flexGrow: 1, position: 'relative', height: '260px' }}>
                      <Line data={trendChartData} options={trendChartOptions} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Predictions Dashboard */}
          {activeTab === 'predictions' && (
            <div className="animate-fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Flame color="var(--accent-amber)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top predicted topic</span>
                    <h4 style={{ fontSize: '1.05rem', margin: '2px 0 0' }}>
                      {predictions[0]?.topic_name || 'Instruction Pipelining'}
                    </h4>
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp color="var(--accent-purple)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hot Trajectory</span>
                    <h4 style={{ fontSize: '1.05rem', margin: '2px 0 0' }}>
                      {predictions[1]?.topic_name || 'Transactions & Concurrency'}
                    </h4>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Upcoming Exam Probability Analysis</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {predictions.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No AI predictions available. Seed the database to view.
                    </div>
                  ) : (
                    predictions.map((pred, i) => {
                      const probPct = Math.round(pred.predicted_probability * 100);
                      let trend = 'Stable Constant';
                      let color = 'var(--accent-indigo)';
                      if (probPct >= 90) {
                        trend = 'Highly Critical';
                        color = 'var(--accent-rose)';
                      } else if (probPct >= 80) {
                        trend = 'Rising Weight';
                        color = 'var(--accent-amber)';
                      }
                      
                      return (
                        <div key={i} style={{ padding: '16px', background: 'rgba(25, 28, 44, 0.25)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <div>
                              <strong style={{ fontSize: '1rem', display: 'block', color: 'white' }}>{pred.topic_name}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Category: {pred.parent_topic_name || 'General'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', color: color }}>
                                {trend}
                              </span>
                              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                                {probPct}%
                              </span>
                            </div>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{pred.reasoning}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Dynamic Study Plan */}
          {activeTab === 'studyplan' && (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>AI-Prioritized Study Roadmap</h3>
                  <p style={{ fontSize: '0.85rem' }}>We generated this dynamic plan focusing on high-probability, low-difficulty topic pairings first to maximize early score gains.</p>
                </div>
              </div>

              {/* Study Plan Customizer Inputs with Curated Weakness chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', padding: '16px', background: 'rgba(25, 28, 44, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Study Plan Duration (Days)</label>
                    <input 
                      type="number" 
                      value={studyPlanDays} 
                      onChange={(e) => setStudyPlanDays(parseInt(e.target.value) || 0)}
                      style={{ padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', width: '120px' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '200px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Weaknesses (Selected below, or type custom)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cache mapping, SQL Queries" 
                      value={studyPlanWeaknesses} 
                      onChange={(e) => setStudyPlanWeaknesses(e.target.value)}
                      style={{ padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white' }} 
                    />
                  </div>
                  <button 
                    className="btn-primary" 
                    style={{ marginTop: '16px', padding: '8px 16px', height: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleUpdateStudyPlan(studyPlanDays, studyPlanWeaknesses)}
                  >
                    <Calendar size={14} /> Generate Plan
                  </button>
                </div>

                {/* Curated Weakness Topic Tags Cloud */}
                {examTopics && examTopics.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <span className="weakness-chips-label">Curated Subjects & Topics (Click to toggle):</span>
                    <div className="curated-weakness-hierarchy">
                      {examTopics.map(subject => {
                        const isSubjectActive = studyPlanWeaknesses.split(',').map(s => s.trim()).includes(subject.name);
                        return (
                          <div key={subject.id} className="subject-weakness-group">
                            <div className="subject-title-chip-row">
                              <button 
                                className={`weakness-chip subject-chip ${isSubjectActive ? 'active' : ''}`}
                                onClick={() => handleToggleWeakness(subject.name)}
                              >
                                {subject.name}
                              </button>
                            </div>
                            <div className="subtopics-chip-row">
                              {subject.subtopics && subject.subtopics.map(subtopic => {
                                const isSubtopicActive = studyPlanWeaknesses.split(',').map(s => s.trim()).includes(subtopic.name);
                                return (
                                  <button 
                                    key={subtopic.id} 
                                    className={`weakness-chip subtopic-chip ${isSubtopicActive ? 'active' : ''}`}
                                    onClick={() => handleToggleWeakness(subtopic.name)}
                                  >
                                    {subtopic.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {studyPlan.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Generating custom plan... Click 'Generate Plan' to configure your custom timeline!
                  </div>
                ) : (
                  studyPlan.map((plan, i) => (
                    <div key={i} style={{ display: 'flex', gap: '20px', background: 'rgba(25, 28, 44, 0.25)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ textAlign: 'center', minWidth: '80px' }}>
                        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-indigo)' }}>{plan.day}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{plan.time}</span>
                      </div>
                      <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }}></div>
                      <div>
                        <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: 'white' }}>{plan.title}</h4>
                        <ul style={{ listStyle: 'none', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {plan.tasks.map((task, tIdx) => (
                            <li key={tIdx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CheckCircle size={14} color="var(--accent-emerald)" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Question Browser — Overhauled with Options rendering and Global search */}
          {activeTab === 'questions' && (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Historical Question Explorer</h3>
                  <p style={{ fontSize: '0.85rem' }}>Browse past paper questions with filtering by subject, topic, and text search.</p>
                </div>
                <span className="question-count-badge">
                  {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
                </span>
              </div>

              {/* Search & Filter Bar */}
              <div className="question-search-bar">
                <div className="search-input-wrapper">
                  <Search size={16} />
                  <input 
                    type="text"
                    className="question-search-input"
                    placeholder="Search all past papers by text, topic, keyword..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                  />
                </div>
                
                <select 
                  className="question-filter-select"
                  value={selectedPaper ? selectedPaper.id : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setSelectedPaper(null); // All Papers global search
                    } else {
                      const paper = papers.find(p => p.id === parseInt(val));
                      if (paper) setSelectedPaper(paper);
                    }
                  }}
                >
                  <option value="">All Papers</option>
                  {papers.map(p => (
                    <option key={p.id} value={p.id}>GATE CS {p.year}</option>
                  ))}
                </select>

                <select 
                  className="question-filter-select"
                  value={questionSubjectFilter}
                  onChange={(e) => setQuestionSubjectFilter(e.target.value)}
                >
                  <option value="">All Subjects</option>
                  {examTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Questions list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {questions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <BookOpen size={48} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                    <p style={{ fontSize: '1rem', fontWeight: '500' }}>No questions found</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      {questionSearch || questionSubjectFilter 
                        ? 'Try adjusting your search or filter criteria. Check if database seeding has been executed.' 
                        : 'Questions will populate once data is seeded or PDF parsing is executed.'}
                    </p>
                  </div>
                ) : (
                  questions.map(q => {
                    const diffLabel = q.difficulty === 'H' ? 'Hard' : q.difficulty === 'M' ? 'Medium' : 'Easy';
                    const parsed = parseOptions(q.question_text);
                    const cleanText = parsed ? parsed.cleanText : q.question_text;
                    const options = parsed ? parsed.options : [];

                    return (
                      <div key={q.id} className="question-card">
                        {/* Card Header */}
                        <div className="question-card-header">
                          <div className="question-card-header-left">
                            <span className="question-number-badge">Q.{q.question_number}</span>
                            
                            {/* Year Badge if showing All Papers */}
                            {!selectedPaper && q.paper_year && (
                              <span className="q-badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                GATE CS {q.paper_year}
                              </span>
                            )}
                            
                            <div className="question-meta-badges">
                              <span className="q-badge q-badge-type">{q.question_style}</span>
                              <span className="q-badge q-badge-marks">{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}</span>
                              <span className={`q-badge q-badge-difficulty-${q.difficulty}`}>{diffLabel}</span>
                            </div>
                          </div>
                          {(q.parent_subject_name || q.topic_name) && (
                            <span className="q-badge q-badge-topic">
                              {q.parent_subject_name || q.topic_name}
                              {q.parent_subject_name && q.topic_name && q.parent_subject_name !== q.topic_name && ` › ${q.topic_name}`}
                            </span>
                          )}
                        </div>
                        
                        {/* Card Body */}
                        <div className="question-card-body">
                          <p className="question-text">{cleanText}</p>
                          
                          {/* MCQ/MSQ option choices rendering */}
                          {options.length > 0 && (
                            <div className="question-options-grid">
                              {options.map((opt, oIdx) => (
                                <div key={oIdx} className="question-option-card">
                                  <span className="question-option-label">{opt.label}</span>
                                  <span className="question-option-text">{opt.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {q.has_diagram && (
                            <div className="question-diagram-placeholder">
                              <Image size={20} />
                              <span>This question contains a diagram or visual element</span>
                            </div>
                          )}
                          
                          <AnswerSpoiler answer={q.correct_answer} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
