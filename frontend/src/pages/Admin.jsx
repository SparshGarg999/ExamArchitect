import React, { useState, useEffect } from 'react';
import { Settings, Check, X, ChevronRight, BrainCircuit, RefreshCw, Database, ShieldAlert, Activity, MessageSquare, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API_BASE } from '../config';

export default function Admin({ addToast }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline');
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [editedData, setEditedData] = useState({});
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [papers, setPapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [retagging, setRetagging] = useState(false);

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  // Logs & Feedbacks State
  const [logs, setLogs] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/exams`)
      .then(res => res.json())
      .then(data => {
        setExams(data);
        if (data.length > 0) setSelectedExamId(data[0].id);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetch(`${API_BASE}/api/exams/${selectedExamId}/papers`)
        .then(res => res.json())
        .then(data => {
          setPapers(data);
          if (data.length > 0) setSelectedPaperId(data[0].id);
        });

      fetch(`${API_BASE}/api/exams/${selectedExamId}/topics`)
        .then(res => res.json())
        .then(data => {
          const topicNames = [];
          data.forEach(t => {
            topicNames.push(t.name);
            if (t.subtopics) t.subtopics.forEach(sub => topicNames.push(sub.name));
          });
          setTopics(topicNames);
        });
    }
  }, [selectedExamId]);

  useEffect(() => {
    if (activeTab === 'pipeline' && selectedPaperId) {
      setLoading(true);
      fetch(`${API_BASE}/api/papers/${selectedPaperId}/staged`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setQuestions(data.map((q, i) => ({ ...q, id: i + 1, is_simulated: false })));
          } else {
            fetch(`${API_BASE}/api/papers/${selectedPaperId}/questions`)
              .then(res => res.json())
              .then(dbQuestions => {
                if (dbQuestions.length > 0) {
                  setQuestions(dbQuestions.map(q => ({ ...q, is_simulated: false, suggested_subject: q.parent_subject_name || q.topic_name, suggested_chapter: q.topic_name })));
                } else {
                  setQuestions([]);
                }
                setLoading(false);
              })
              .catch(() => { setQuestions([]); setLoading(false); });
            return;
          }
          setLoading(false);
          setCurrentIndex(0);
        })
        .catch(() => { setQuestions([]); setLoading(false); });
    }
  }, [selectedPaperId, activeTab]);

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      setEditedData(questions[currentIndex]);
    }
  }, [currentIndex, questions]);

  useEffect(() => {
    if (activeTab === 'logs' || activeTab === 'feedbacks') {
      const token = localStorage.getItem('token');
      if (activeTab === 'logs') {
        fetch(`${API_BASE}/api/admin/logs`, { headers: { 'Authorization': `Bearer ${token}` }})
          .then(res => res.json())
          .then(data => setLogs(data))
          .catch(err => console.error(err));
      } else {
        fetch(`${API_BASE}/api/admin/feedbacks`, { headers: { 'Authorization': `Bearer ${token}` }})
          .then(res => res.json())
          .then(data => setFeedbacks(data))
          .catch(err => console.error(err));
      }
    }
  }, [activeTab]);

  const handlePasswordReset = (e) => {
    e.preventDefault();
    setResetError('');
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }
    setResetting(true);
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ new_password: newPassword, confirm_password: confirmPassword })
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to reset password');
        }
        return res.json();
      })
      .then(() => {
        setResetting(false);
        if (addToast) addToast('Password reset successful!', 'success');
        // Force a page reload to update currentUser context
        window.location.reload();
      })
      .catch(err => {
        setResetting(false);
        setResetError(err.message);
      });
  };

  const handleApprove = () => {
    if (!selectedPaperId) return;
    const approvalPayload = {
      questions: [{
        question_number: editedData.question_number || currentIndex + 1,
        question_text: editedData.question_text || '',
        marks: parseFloat(editedData.marks) || 1.0,
        question_style: editedData.question_style || 'MCQ',
        difficulty: editedData.difficulty || 'M',
        correct_answer: editedData.correct_answer || null,
        suggested_subject: editedData.suggested_subject || null,
        suggested_chapter: editedData.suggested_chapter || null,
        image_path: editedData.image_path || null
      }]
    };

    setLoading(true);
    fetch(`${API_BASE}/api/papers/${selectedPaperId}/staged/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approvalPayload)
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(() => {
        setLoading(false);
        if (addToast) addToast(`Question approved!`, 'success');
        if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
        else if (addToast) addToast('All questions reviewed!', 'success');
      })
      .catch(err => {
        setLoading(false);
        if (addToast) addToast(`Failed: ${err.message}`, 'error');
      });
  };

  const handleReject = () => {
    if (addToast) addToast(`Question skipped`, 'info');
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const currentQ = questions[currentIndex] || {};

  const parseUserAgent = (ua) => {
    if (!ua) return 'Unknown Device';
    let browser = 'Unknown';
    let os = 'Unknown OS';
    
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'Mac OS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('like Mac OS X')) os = 'iOS';
    
    return `${browser} on ${os}`;
  };

  if (!currentUser || currentUser.role !== 'admin') return null;

  if (currentUser?.requires_password_change) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in flex justify-center items-center min-h-[70vh]">
        <div className="glass-panel p-8 w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <ShieldAlert size={48} className="text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold font-display text-center">Security Requirement</h2>
            <p className="text-sm text-slate-400 mt-2 text-center">For security reasons, you must change your default password before accessing the admin console.</p>
          </div>
          
          {resetError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <AlertTriangle size={16} /> {resetError}
            </div>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-[#121420]/80 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-[#121420]/80 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={resetting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-semibold flex justify-center items-center gap-2 transition-colors mt-6"
            >
              {resetting ? <RefreshCw size={18} className="animate-spin" /> : <><Check size={18} /> Update Password</>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="glass-panel p-6 mb-8 border-l-4 border-l-rose-500 flex flex-wrap justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-3">
            <ShieldAlert className="text-rose-500" /> Admin Console
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage data ingestion, view user activity, and moderate feedbacks.</p>
        </div>
      </div>

      <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
        <button 
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'pipeline' ? 'border-indigo-500 text-white bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
          onClick={() => setActiveTab('pipeline')}
        >
          <Database size={18} /> Ingestion Pipeline
        </button>
        <button 
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'logs' ? 'border-emerald-500 text-white bg-emerald-500/10' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
          onClick={() => setActiveTab('logs')}
        >
          <Activity size={18} /> Activity Logs
        </button>
        <button 
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'feedbacks' ? 'border-amber-500 text-white bg-amber-500/10' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
          onClick={() => setActiveTab('feedbacks')}
        >
          <MessageSquare size={18} /> User Feedbacks
        </button>
      </div>

      {activeTab === 'pipeline' && (
        <div className="animate-fade-in">
          <div className="flex flex-wrap gap-4 mb-6">
            <select 
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
              value={selectedExamId || ''}
              onChange={(e) => setSelectedExamId(parseInt(e.target.value))}
            >
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            <select 
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
              value={selectedPaperId || ''}
              onChange={(e) => setSelectedPaperId(parseInt(e.target.value))}
            >
              {papers.map(p => <option key={p.id} value={p.id}>GATE CS {p.year}</option>)}
            </select>
          </div>

          {questions.length === 0 ? (
            <div className="glass-panel p-10 text-center">
              <Database size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">No Pending Questions</h3>
              <p className="text-slate-400">Select a different paper or run the PDF parser.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Pane */}
              <div className="glass-panel p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Visual Extraction</h3>
                  <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold">Q{currentQ.question_number || currentIndex + 1}</span>
                </div>
                <div className="bg-black/40 rounded-xl border border-white/5 flex-grow flex items-center justify-center p-4 min-h-[300px]">
                  {currentQ.is_simulated || !currentQ.diagram_path ? (
                    <div className="text-center text-slate-500">
                      <BrainCircuit size={48} className="mx-auto mb-3 opacity-50" />
                      <p>{currentQ.has_diagram ? 'Contains Diagram' : 'No Visual Content'}</p>
                    </div>
                  ) : (
                    <img src={currentQ.diagram_path} alt="Question" className="max-w-full max-h-full rounded-lg" />
                  )}
                </div>
              </div>

              {/* Data Pane */}
              <div className="glass-panel p-6 flex flex-col h-full">
                <h3 className="font-bold mb-4 flex justify-between items-center">
                  Gemini AI Tagging
                  <span className="text-xs text-slate-400 font-normal">Reviewing {currentIndex + 1} of {questions.length}</span>
                </h3>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Transcription</label>
                    <textarea 
                      value={editedData.question_text || ''}
                      onChange={(e) => setEditedData({...editedData, question_text: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500 min-h-[120px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Subject</label>
                      <select 
                        value={editedData.suggested_subject || ''}
                        onChange={(e) => setEditedData({...editedData, suggested_subject: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-indigo-500"
                      >
                        <option value="">Select...</option>
                        {topics.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Chapter</label>
                      <input 
                        type="text" 
                        value={editedData.suggested_chapter || ''}
                        onChange={(e) => setEditedData({...editedData, suggested_chapter: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Type</label>
                      <select value={editedData.question_style || 'MCQ'} onChange={(e) => setEditedData({...editedData, question_style: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm outline-none">
                        <option value="MCQ">MCQ</option>
                        <option value="MSQ">MSQ</option>
                        <option value="NAT">NAT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Diff</label>
                      <select value={editedData.difficulty || 'M'} onChange={(e) => setEditedData({...editedData, difficulty: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm outline-none">
                        <option value="E">Easy</option>
                        <option value="M">Medium</option>
                        <option value="H">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Marks</label>
                      <input type="number" step="0.5" value={editedData.marks || 1} onChange={(e) => setEditedData({...editedData, marks: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Correct Answer</label>
                    <input 
                      type="text" 
                      value={editedData.correct_answer || ''}
                      onChange={(e) => setEditedData({...editedData, correct_answer: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex gap-4 mt-4">
                    <button onClick={handleReject} disabled={loading} className="flex-1 bg-transparent border border-rose-500/50 hover:bg-rose-500/10 text-rose-400 py-2 rounded-lg font-semibold flex justify-center items-center gap-2 transition-colors">
                      <X size={18} /> Reject
                    </button>
                    <button onClick={handleApprove} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-semibold flex justify-center items-center gap-2 transition-colors">
                      <Check size={18} /> {loading ? 'Saving...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="glass-panel p-6 animate-fade-in">
          <h3 className="text-xl font-bold mb-6">User Activity Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="p-3 rounded-tl-lg">ID</th>
                  <th className="p-3">User Email</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Device & OS</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3 rounded-tr-lg">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? logs.map(l => (
                  <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 text-slate-400">{l.id}</td>
                    <td className="p-3 text-indigo-400">{l.user_email}</td>
                    <td className="p-3"><span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs">{l.action}</span></td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{parseUserAgent(l.user_agent)}</td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{l.ip_address}</td>
                    <td className="p-3 text-slate-400">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="p-6 text-center text-slate-500">No logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'feedbacks' && (
        <div className="glass-panel p-6 animate-fade-in">
          <h3 className="text-xl font-bold mb-6">User Question Feedbacks</h3>
          <div className="flex flex-col gap-4">
            {feedbacks.length > 0 ? feedbacks.map(f => (
              <div key={f.id} className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-wrap gap-4 justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-amber-500/20 text-amber-500 px-2 py-1 rounded text-xs font-bold">{f.feedback_type}</span>
                    <span className="text-slate-400 text-sm">Question ID: {f.question_id}</span>
                  </div>
                  <p className="text-slate-200 text-sm mb-2">"{f.comment}"</p>
                  <p className="text-xs text-slate-500">Submitted by User #{f.user_id} on {new Date(f.created_at).toLocaleString()}</p>
                </div>
                <button className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                  <Check size={14} /> Resolve
                </button>
              </div>
            )) : (
              <p className="text-center text-slate-500 py-6">No feedbacks pending.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
