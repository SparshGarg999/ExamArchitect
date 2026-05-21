import React, { useState } from 'react';
import { Image, ChevronRight } from 'lucide-react';

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

export default function QuestionCard({ q, selectedPaper }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const parsed = parseOptions(q.question_text);
  const cleanText = parsed ? parsed.cleanText : q.question_text;
  const options = parsed ? parsed.options : [];
  const diffLabel = q.difficulty === 'H' ? 'Hard' : q.difficulty === 'M' ? 'Medium' : 'Easy';

  return (
    <div className="question-card">
      {/* Card Header */}
      <div className="question-card-header">
        <div className="question-card-header-left">
          <span className="question-number-badge">Q.{q.question_number}</span>
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

        {options.length > 0 && (
          <div className="question-options-grid">
            {options.map((opt, oIdx) => {
              const isSelected = selectedOption === opt.label;
              let cardClass = "question-option-card";

              if (isSelected) {
                cardClass += " selected";
              }
              if (showAnswer) {
                if (opt.label === q.correct_answer) {
                  cardClass += " correct";
                } else if (isSelected) {
                  cardClass += " incorrect";
                }
              }

              return (
                <div
                  key={oIdx}
                  className={cardClass}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedOption(prev => prev === opt.label ? null : opt.label);
                  }}
                >
                  <span className="question-option-label">{opt.label}</span>
                  <span className="question-option-text">{opt.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {q.has_diagram && (
          <div className="question-diagram-placeholder">
            <Image size={20} />
            <span>This question contains a diagram or visual element</span>
          </div>
        )}

        {/* Answer Spoiler Toggle */}
        <div className="answer-spoiler">
          <button className={`answer-spoiler-toggle ${showAnswer ? 'open' : ''}`} onClick={() => setShowAnswer(!showAnswer)}>
            <ChevronRight size={14} />
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>
          {showAnswer && (
            <div className="answer-spoiler-content">
              Correct Answer: <strong style={{ color: 'var(--accent-emerald)' }}>{q.correct_answer}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
