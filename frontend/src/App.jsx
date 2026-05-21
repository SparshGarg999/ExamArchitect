import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Cpu, 
  BarChart3, 
  Layers, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  ListTodo,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

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
import Dashboard from './components/Dashboard';
import StudyPlan, { getFallbackPlan } from './components/StudyPlan';
import QuestionBrowser from './components/QuestionBrowser';


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
          <Dashboard
            activeTab={activeTab}
            heatmapData={heatmapData}
            seeding={seeding}
            handleReseed={handleReseed}
            expandedSubjects={expandedSubjects}
            handleToggleSubject={handleToggleSubject}
            handleToggleWeakness={handleToggleWeakness}
            subtopicHeatmaps={subtopicHeatmaps}
            renderHeatmapCell={renderHeatmapCell}
            selectedHeatmapTopic={selectedHeatmapTopic}
            setSelectedHeatmapTopic={setSelectedHeatmapTopic}
            topicDetailsRef={topicDetailsRef}
            predictions={predictions}
            trendChartData={trendChartData}
            trendChartOptions={trendChartOptions}
          />

          {/* TAB 3: Dynamic Study Plan */}
          <StudyPlan
            activeTab={activeTab}
            studyPlanDays={studyPlanDays}
            setStudyPlanDays={setStudyPlanDays}
            studyPlanWeaknesses={studyPlanWeaknesses}
            setStudyPlanWeaknesses={setStudyPlanWeaknesses}
            handleUpdateStudyPlan={handleUpdateStudyPlan}
            examTopics={examTopics}
            handleToggleWeakness={handleToggleWeakness}
            studyPlan={studyPlan}
          />

          {/* TAB 4: Question Browser */}
          {activeTab === 'questions' && (
            <QuestionBrowser
              questions={questions}
              questionSearch={questionSearch}
              setQuestionSearch={setQuestionSearch}
              selectedPaper={selectedPaper}
              setSelectedPaper={setSelectedPaper}
              papers={papers}
              questionSubjectFilter={questionSubjectFilter}
              setQuestionSubjectFilter={setQuestionSubjectFilter}
              examTopics={examTopics}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
