import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, AlertCircle, SaveAll, CheckCircle, RefreshCw, XCircle, Trash2, BookOpen } from 'lucide-react';
import QuestionCard, { checkNatCorrectness } from '../components/QuestionCard';
import WeaknessChatbot from '../components/WeaknessChatbot';

import { API_BASE } from '../config';

export default function MockExam({ addToast }) {
  const { currentUser } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [difficulty, setDifficulty] = useState('M');
  const [loading, setLoading] = useState(false);
  const [mockExam, setMockExam] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  // Interactive Quiz States
  const [userAnswers, setUserAnswers] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPossibleMarks, setTotalPossibleMarks] = useState(0);

  // Saved Exams list state
  const [savedExams, setSavedExams] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // AI Mentor Chat states
  const [mentorChatOpen, setMentorChatOpen] = useState(false);
  const [mentorQuestion, setMentorQuestion] = useState(null);

  const handleAskMentor = (question) => {
    setMentorQuestion(question);
    setMentorChatOpen(true);
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/exams`)
      .then(res => res.json())
      .then(data => {
        setExams(data);
        if (data.length > 0) setSelectedExamId(data[0].id);
      })
      .catch(console.error);
  }, []);

  const fetchSavedExams = async () => {
    if (!currentUser) return;
    setLoadingSaved(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/user-exams`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedExams(data);
      }
    } catch (err) {
      console.error('Failed to fetch saved exams', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSavedExams();
    } else {
      setSavedExams([]);
    }
  }, [currentUser]);

  const handleGenerate = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    setMockExam(null);
    setSaveStatus('');
    setUserAnswers({});
    setExamSubmitted(false);
    setScore(0);
    setTotalPossibleMarks(0);

    try {
      const res = await fetch(`${API_BASE}/api/questions?exam_id=${selectedExamId}`);
      const data = await res.json();
      
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 10);
      
      const totalMarks = selected.reduce((acc, q) => acc + (q.marks || 1), 0);
      setTotalPossibleMarks(totalMarks);

      const initialAnswers = {};
      selected.forEach(q => {
        initialAnswers[q.id] = q.question_style === 'MSQ' ? [] : '';
      });
      setUserAnswers(initialAnswers);

      const targetExam = exams.find(e => String(e.id) === String(selectedExamId));
      const newMock = {
        title: `AI Mock - ${targetExam ? targetExam.name : 'Exam'} (${difficulty === 'E' ? 'Easy' : difficulty === 'H' ? 'Hard' : 'Medium'})`,
        questions: selected
      };
      
      setMockExam(newMock);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSavedExam = async (examId) => {
    setLoading(true);
    setSaveStatus('');
    setUserAnswers({});
    setExamSubmitted(false);
    setScore(0);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/user-exams/${examId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // questions_json is loaded directly
        const questionsList = Array.isArray(data.questions_json) 
          ? data.questions_json 
          : (typeof data.questions_json === 'string' ? JSON.parse(data.questions_json) : []);
        
        const totalMarks = questionsList.reduce((acc, q) => acc + (q.marks || 1), 0);
        setTotalPossibleMarks(totalMarks);

        const initialAnswers = {};
        questionsList.forEach(q => {
          initialAnswers[q.id] = q.question_style === 'MSQ' ? [] : '';
        });
        setUserAnswers(initialAnswers);

        setMockExam({
          id: data.id,
          title: data.title,
          questions: questionsList
        });
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSavedExam = async (e, examId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved exam?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/user-exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchSavedExams();
        if (mockExam && mockExam.id === examId) {
          setMockExam(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswerChange = (qId, val) => {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: val
    }));
  };

  const handleSubmitExam = () => {
    if (!mockExam) return;
    
    let calculatedScore = 0;
    mockExam.questions.forEach(q => {
      const answer = userAnswers[q.id];
      if (q.question_style === 'NAT') {
        if (checkNatCorrectness(String(answer), q.correct_answer || '')) {
          calculatedScore += q.marks || 1;
        }
      } else if (q.question_style === 'MSQ') {
        const correctList = q.correct_answer 
          ? q.correct_answer.split(',').map(x => x.trim().toUpperCase()).filter(Boolean) 
          : [];
        const userList = Array.isArray(answer) ? answer : [];
        const cleanUser = userList.map(x => x.trim().toUpperCase()).sort().join('');
        const cleanCorrect = correctList.sort().join('');
        if (cleanUser === cleanCorrect && cleanCorrect.length > 0) {
          calculatedScore += q.marks || 1;
        }
      } else {
        // MCQ
        if (typeof answer === 'string' && q.correct_answer && answer.trim().toUpperCase() === q.correct_answer.trim().toUpperCase()) {
          calculatedScore += q.marks || 1;
        }
      }
    });

    setScore(calculatedScore);
    setExamSubmitted(true);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    if (!mockExam || mockExam.questions.length === 0) return;
    
    setSaveStatus('saving');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/user-exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: mockExam.title,
          topics: 'AI Generated Mock',
          difficulty: difficulty === 'E' ? 'Easy' : difficulty === 'H' ? 'Hard' : 'Medium',
          questions_json: mockExam.questions
        })
      });
      if (res.ok) {
        setSaveStatus('saved');
        fetchSavedExams();
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-display mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          AI Mock Exam Generator
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Generate custom practice tests based on historical paper topic frequencies, 
          or load previously saved mock exams directly into your interactive test sheet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel and Saved Exams List (Left Sidebar) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 border border-white/5 bg-[#121420]/60">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BrainCircuit className="text-indigo-400" size={18} /> Test Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Target Examination</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                  value={selectedExamId}
                  onChange={e => setSelectedExamId(e.target.value)}
                >
                  <option value="">Select Exam...</option>
                  {exams.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.name})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Difficulty Profile</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                >
                  <option value="E">Easy (Conceptual pairings)</option>
                  <option value="M">Medium (Balanced standard)</option>
                  <option value="H">Hard (Numerical & multi-step)</option>
                </select>
              </div>
            </div>
            <button 
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              onClick={handleGenerate}
              disabled={loading || !selectedExamId}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <BrainCircuit size={16} />
              )}
              {loading ? 'Synthesizing...' : 'Generate Mock Paper'}
            </button>
          </div>

          {/* Saved Exams Profile Section */}
          {currentUser && (
            <div className="glass-panel p-6 border border-white/5 bg-[#121420]/60">
              <h3 className="text-sm uppercase font-bold tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-emerald-400" /> Saved Exams Profile
              </h3>
              {loadingSaved ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
                  <RefreshCw className="animate-spin" size={12} /> Loading saved tests...
                </div>
              ) : savedExams.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No saved papers found. Generate a paper and save it for later!</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {savedExams.map(ex => (
                    <div 
                      key={ex.id}
                      onClick={() => handleLoadSavedExam(ex.id)}
                      className="group flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 p-3 rounded-lg cursor-pointer transition-all"
                    >
                      <div className="min-w-0 flex-grow">
                        <strong className="text-xs text-white block truncate group-hover:text-indigo-400 transition-colors">{ex.title}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{ex.difficulty} • {new Date(ex.created_at).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSavedExam(e, ex.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition-colors shrink-0"
                        title="Delete saved exam"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mock Exam Interactive Testing Sheet (Right Main Content) */}
        <div className="lg:col-span-2">
          {mockExam ? (
            <div className="space-y-6">
              {/* Active Test Header Bar */}
              <div className="glass-panel p-6 flex flex-wrap justify-between items-center gap-4 border-l-4 border-l-emerald-500 bg-[#121420]/80">
                <div>
                  <h2 className="text-xl font-bold text-white">{mockExam.title}</h2>
                  <p className="text-slate-400 text-sm mt-1">{mockExam.questions.length} Questions • Estimated Time: 30 mins</p>
                </div>
                
                <div className="flex gap-3">
                  {currentUser ? (
                    <button 
                      onClick={handleSave}
                      disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                      className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 text-xs border transition-all cursor-pointer ${
                        saveStatus === 'saved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                        'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      }`}
                    >
                      {saveStatus === 'saving' ? <RefreshCw className="animate-spin" size={14} /> : 
                       saveStatus === 'saved' ? <CheckCircle size={14} /> : <SaveAll size={14} />}
                      {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved to Profile' : 'Save for Later'}
                    </button>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                      <AlertCircle size={13} /> Login to save
                    </div>
                  )}
                </div>
              </div>

              {/* Graded Score Report */}
              {examSubmitted && (
                <div className="glass-panel p-6 bg-[#10b981]/5 border border-emerald-500/20 rounded-2xl flex flex-wrap justify-between items-center gap-6 animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Mock Exam Graded!</h3>
                      <p className="text-slate-400 text-sm mt-0.5">Your correct answers and detailed feedback are displayed below.</p>
                    </div>
                  </div>
                  <div className="text-center bg-black/30 px-6 py-3 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Your Total Score</span>
                    <span className="text-3xl font-extrabold text-emerald-400">
                      {score.toFixed(1)} <span className="text-slate-500 text-xl">/ {totalPossibleMarks.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Questions list */}
              <div className="space-y-6">
                {mockExam.questions.map((q, idx) => (
                  <QuestionCard 
                    key={q.id}
                    q={q}
                    qNumber={idx + 1}
                    selectedPaper={null}
                    controlledAnswer={userAnswers[q.id]}
                    onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                    controlledShowAnswer={examSubmitted}
                    onAskMentor={handleAskMentor}
                  />
                ))}
              </div>

              {/* Action Row */}
              {!examSubmitted && (
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={handleSubmitExam}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base py-3.5 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                  >
                    Submit Exam & Calculate Score
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center border border-white/5 bg-[#121420]/30 min-h-[300px] flex flex-col justify-center items-center">
              <BrainCircuit className="text-indigo-500/40 mb-4 animate-pulse" size={48} />
              <h3 className="text-lg font-bold text-slate-300">No Active Testing Sheet</h3>
              <p className="text-slate-400 text-sm max-w-sm mt-2">Configure exam settings in the left panel and click generate, or load a saved test from your profile.</p>
            </div>
          )}
        </div>
      </div>
      
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
    </div>
  );
}
