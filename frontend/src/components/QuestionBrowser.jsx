import React, { useState } from 'react';
import { Search, BookOpen, Image, ChevronRight } from 'lucide-react';

// ============= Pure Helper to parse MCQ Options =============
export function parseOptions(text) {
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

// ============= Co-located Answer Spoiler Component =============
export function AnswerSpoiler({ answer }) {
  const [open, setOpen] = useState(false);
  if (!answer) return null;
  return (
    <div className="answer-spoiler">
      <button
        className={`answer-spoiler-toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
      >
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

// ============= Main QuestionBrowser Component =============
function QuestionBrowser({
  questions,
  questionSearch,
  setQuestionSearch,
  selectedPaper,
  setSelectedPaper,
  papers,
  questionSubjectFilter,
  setQuestionSubjectFilter,
  examTopics,
}) {
  return (
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
  );
}

export default QuestionBrowser;
