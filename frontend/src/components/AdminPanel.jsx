import React, { useState, useEffect } from 'react';
import { Settings, Check, X, ChevronRight, Upload, BrainCircuit, RefreshCw, Database, FileText } from 'lucide-react';

export default function AdminPanel({ onNavigate, apiBaseUrl, addToast }) {
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

  // Fetch exams on mount
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/exams`)
      .then(res => res.json())
      .then(data => {
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0].id);
        }
      })
      .catch(err => console.error('Failed to fetch exams:', err));
  }, [apiBaseUrl]);

  // Fetch papers when exam changes
  useEffect(() => {
    if (selectedExamId) {
      fetch(`${apiBaseUrl}/api/exams/${selectedExamId}/papers`)
        .then(res => res.json())
        .then(data => {
          setPapers(data);
          if (data.length > 0) {
            setSelectedPaperId(data[0].id);
          }
        })
        .catch(err => console.error('Failed to fetch papers:', err));

      // Fetch topics for taxonomy dropdowns
      fetch(`${apiBaseUrl}/api/exams/${selectedExamId}/topics`)
        .then(res => res.json())
        .then(data => {
          const topicNames = [];
          data.forEach(t => {
            topicNames.push(t.name);
            if (t.subtopics) {
              t.subtopics.forEach(sub => topicNames.push(sub.name));
            }
          });
          setTopics(topicNames);
        })
        .catch(err => console.error('Failed to fetch topics:', err));
    }
  }, [selectedExamId, apiBaseUrl]);

  // Fetch staged questions when paper changes
  useEffect(() => {
    if (selectedPaperId) {
      setLoading(true);
      fetch(`${apiBaseUrl}/api/papers/${selectedPaperId}/staged`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setQuestions(data.map((q, i) => ({ ...q, id: i + 1, is_simulated: false })));
          } else {
            // Fall back to actual questions from DB for review
            fetch(`${apiBaseUrl}/api/papers/${selectedPaperId}/questions`)
              .then(res => res.json())
              .then(dbQuestions => {
                if (dbQuestions.length > 0) {
                  setQuestions(dbQuestions.map(q => ({ ...q, is_simulated: false, suggested_subject: q.parent_subject_name || q.topic_name, suggested_chapter: q.topic_name })));
                } else {
                  // Show empty state — no staged or existing questions
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
        .catch(err => {
          console.error('Failed to fetch staged questions:', err);
          setQuestions([]);
          setLoading(false);
        });
    }
  }, [selectedPaperId, apiBaseUrl]);

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      setEditedData(questions[currentIndex]);
    }
  }, [currentIndex, questions]);

  const handleApprove = () => {
    if (!selectedPaperId) return;
    
    // Submit the single edited question to the backend
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
    fetch(`${apiBaseUrl}/api/papers/${selectedPaperId}/staged/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approvalPayload)
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setLoading(false);
        if (addToast) addToast(`Question ${editedData.question_number || currentIndex + 1} approved & ingested!`, 'success');
        
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          if (addToast) addToast('All questions reviewed!', 'success');
        }
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
        if (addToast) addToast(`Failed to approve question: ${err.message}`, 'error');
      });
  };

  const handleReject = () => {
    if (addToast) addToast(`Question ${editedData.question_number || currentIndex + 1} skipped`, 'info');
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      if (addToast) addToast('All questions reviewed!', 'success');
    }
  };

  const handleRetag = () => {
    if (!selectedPaperId || retagging) return;
    setRetagging(true);
    if (addToast) addToast('Re-tagging question with AI...', 'info');
    
    fetch(`${apiBaseUrl}/api/papers/${selectedPaperId}/parse`, { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setRetagging(false);
        if (addToast) addToast(`AI re-tagging complete: ${data.question_count} questions processed`, 'success');
        // Refresh staged questions
        setSelectedPaperId(prev => prev); // trigger re-fetch
      })
      .catch(err => {
        setRetagging(false);
        console.error(err);
        if (addToast) addToast(`Re-tagging failed: ${err.message}`, 'error');
      });
  };

  const handleRegeneratePredictions = () => {
    if (!selectedExamId || regenerating) return;
    setRegenerating(true);
    if (addToast) addToast('Generating AI predictions...', 'info');

    fetch(`${apiBaseUrl}/api/exams/${selectedExamId}/predictions/generate`, { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setRegenerating(false);
        if (addToast) addToast(`Successfully generated ${data.predictions_count} predictions!`, 'success');
      })
      .catch(err => {
        setRegenerating(false);
        console.error(err);
        if (addToast) addToast(`Failed to generate predictions: ${err.message}`, 'error');
      });
  };

  if (questions.length === 0 && !loading) {
    return (
      <div className="admin-panel" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <header className="admin-header">
          <div className="header-left">
            <button className="icon-btn" onClick={() => onNavigate('dashboard')}>
              <ChevronRight style={{ transform: 'rotate(180deg)' }} /> Back
            </button>
            <h1><Settings /> Data Pipeline Admin</h1>
          </div>
          <div className="header-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Exam selector */}
            <select 
              style={{ background: 'rgba(18, 20, 32, 0.8)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem' }}
              value={selectedExamId || ''}
              onChange={(e) => setSelectedExamId(parseInt(e.target.value))}
            >
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
            <button 
              className="text-btn" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: regenerating ? 'not-allowed' : 'pointer', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 12px', borderRadius: '6px', color: 'white', fontSize: '0.8rem', opacity: regenerating ? 0.6 : 1 }}
              onClick={handleRegeneratePredictions}
              disabled={regenerating}
            >
              {regenerating ? <span className="btn-spinner"></span> : <BrainCircuit size={14} />} 
              {regenerating ? 'Generating...' : 'Regenerate AI Predictions'}
            </button>
          </div>
        </header>
        
        <div className="empty-state">
          <Database size={48} style={{ opacity: 0.4 }} />
          <h2>No Pending Questions to Review</h2>
          <p>Select a paper to review its questions, or run the PDF Parser to ingest new past papers.</p>
          
          {/* Paper selector */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
            <select 
              style={{ background: 'rgba(18, 20, 32, 0.8)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
              value={selectedPaperId || ''}
              onChange={(e) => setSelectedPaperId(parseInt(e.target.value))}
            >
              <option value="">Select Paper...</option>
              {papers.map(p => (
                <option key={p.id} value={p.id}>GATE CS {p.year} (Session {p.session})</option>
              ))}
            </select>
          </div>
          
          <button className="primary-btn" onClick={() => onNavigate('dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || {};

  return (
    <div className="admin-panel" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <header className="admin-header">
        <div className="header-left">
          <button className="icon-btn" onClick={() => onNavigate('dashboard')}>
            <ChevronRight style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
          <h1><Settings /> Data Pipeline Admin</h1>
        </div>
        <div className="header-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Exam selector */}
          <select 
            style={{ background: 'rgba(18, 20, 32, 0.8)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem' }}
            value={selectedExamId || ''}
            onChange={(e) => setSelectedExamId(parseInt(e.target.value))}
          >
            {exams.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>

          {/* Paper selector */}
          <select 
            style={{ background: 'rgba(18, 20, 32, 0.8)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem' }}
            value={selectedPaperId || ''}
            onChange={(e) => setSelectedPaperId(parseInt(e.target.value))}
          >
            {papers.map(p => (
              <option key={p.id} value={p.id}>GATE CS {p.year}</option>
            ))}
          </select>

          <button 
            className="text-btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: regenerating ? 'not-allowed' : 'pointer', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 12px', borderRadius: '6px', color: 'white', fontSize: '0.8rem', opacity: regenerating ? 0.6 : 1 }}
            onClick={handleRegeneratePredictions}
            disabled={regenerating}
          >
            {regenerating ? <span className="btn-spinner"></span> : <BrainCircuit size={14} />}
            {regenerating ? 'Generating...' : 'Regenerate AI Predictions'}
          </button>
          <div className="progress-badge">
            Reviewing {currentIndex + 1} of {questions.length}
          </div>
        </div>
      </header>

      <div className="admin-workspace">
        {/* Left Pane: Original Image View */}
        <div className="workspace-pane image-pane">
          <div className="pane-header">
            <h3>Visual Slicer Extraction</h3>
            <span className="badge">Q{currentQ.question_number || currentIndex + 1}</span>
          </div>
          <div className="image-container">
            {currentQ.is_simulated || !currentQ.diagram_path ? (
              <div className="simulated-image">
                <BrainCircuit size={48} />
                <p>{currentQ.has_diagram ? 'Question Contains Diagram' : 'No Visual Content'}</p>
                <small>{currentQ.diagram_path || 'No image available'}</small>
              </div>
            ) : (
              <img src={currentQ.diagram_path} alt={`Question ${currentQ.question_number}`} />
            )}
          </div>
        </div>

        {/* Right Pane: AI Transcription & Taxonomy */}
        <div className="workspace-pane data-pane">
          <div className="pane-header">
            <h3>Gemini AI Tagging</h3>
            <button 
              className="text-btn" 
              onClick={handleRetag}
              disabled={retagging}
              style={{ opacity: retagging ? 0.6 : 1, cursor: retagging ? 'not-allowed' : 'pointer' }}
            >
              {retagging ? <span className="btn-spinner"></span> : <RefreshCw size={14} />}
              {retagging ? 'Retagging...' : 'Retag'}
            </button>
          </div>
          
          <div className="form-group">
            <label>Transcription (Markdown + LaTeX)</label>
            <textarea 
              value={editedData.question_text || ''}
              onChange={(e) => setEditedData({...editedData, question_text: e.target.value})}
              rows={6}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Subject</label>
              <select 
                value={editedData.suggested_subject || ''}
                onChange={(e) => setEditedData({...editedData, suggested_subject: e.target.value})}
              >
                <option value="">Select Subject...</option>
                {topics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Chapter</label>
              <input 
                type="text" 
                value={editedData.suggested_chapter || ''}
                onChange={(e) => setEditedData({...editedData, suggested_chapter: e.target.value})}
              />
            </div>
          </div>

          <div className="form-row triple">
             <div className="form-group">
              <label>Type</label>
              <select value={editedData.question_style || 'MCQ'} onChange={(e) => setEditedData({...editedData, question_style: e.target.value})}>
                <option value="MCQ">MCQ</option>
                <option value="MSQ">MSQ</option>
                <option value="NAT">NAT</option>
              </select>
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select value={editedData.difficulty || 'M'} onChange={(e) => setEditedData({...editedData, difficulty: e.target.value})}>
                <option value="E">Easy</option>
                <option value="M">Medium</option>
                <option value="H">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label>Marks</label>
              <input type="number" step="0.5" value={editedData.marks || 1} onChange={(e) => setEditedData({...editedData, marks: parseFloat(e.target.value)})} />
            </div>
          </div>

           <div className="form-group">
              <label>Correct Answer</label>
              <input 
                type="text" 
                value={editedData.correct_answer || ''}
                onChange={(e) => setEditedData({...editedData, correct_answer: e.target.value})}
              />
            </div>

          <div className="action-footer">
             <button className="danger-btn outline" onClick={handleReject} disabled={loading}>
                <X size={18} /> Reject
             </button>
             <button className="success-btn" onClick={handleApprove} disabled={loading}>
                {loading ? <span className="btn-spinner"></span> : <Check size={18} />}
                {loading ? 'Ingesting...' : 'Approve & Ingest'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
