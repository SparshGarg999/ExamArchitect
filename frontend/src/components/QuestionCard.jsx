import React, { useState } from 'react';
import { Image, ChevronRight, Check, X, Bot } from 'lucide-react';

function parseOptions(text) {
  if (!text) return null;
  const mcqPattern = /(?:\(|\s|^)([A-Da-d])\)(?:\s+|:)([\s\S]*?)(?=\s*(?:\(|^[A-Da-d]\)|[A-Da-d]\s*[.):]\s|$))/g;
  const matches = [...text.matchAll(mcqPattern)];
  if (matches.length > 0) {
    const options = matches.map(m => ({ label: m[1].toUpperCase(), text: m[2].trim() }));
    const idx = text.search(/(?:\(|\s|^)[A-Da-d]\)(?:\s+|:)/);
    const cleanText = idx !== -1 ? text.substring(0, idx).trim() : text;
    return { cleanText, options };
  }
  const dotPattern = /(?:\s|^)([A-Da-d])\.(?:\s+|:)([\s\S]*?)(?=\s*(?:^[A-Da-d]\.|[A-Da-d]\s*[.):]\s|$))/g;
  const matchesDot = [...text.matchAll(dotPattern)];
  if (matchesDot.length > 0) {
    const options = matchesDot.map(m => ({ label: m[1].toUpperCase(), text: m[2].trim() }));
    const idx = text.search(/(?:\s|^)[A-Da-d]\.(?:\s+|:)/);
    const cleanText = idx !== -1 ? text.substring(0, idx).trim() : text;
    return { cleanText, options };
  }
  return null;
}

export function checkNatCorrectness(userInput, correctAnswer) {
  if (!userInput || !correctAnswer) return false;
  const userStr = userInput.trim().replace(/\s+/g, '');
  const correctStr = correctAnswer.trim().replace(/\s+/g, '');
  
  // Direct string equality check (e.g. for exact matching or text fallbacks)
  if (userStr.toLowerCase() === correctStr.toLowerCase()) {
    return true;
  }

  const cleanUser = parseFloat(userStr);
  if (isNaN(cleanUser)) return false;

  // Check for range match (e.g., "12 to 13" or "12.0 to 13.0")
  if (correctStr.toLowerCase().includes('to')) {
    const parts = correctStr.toLowerCase().split('to').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return cleanUser >= parts[0] && cleanUser <= parts[1];
    }
  }

  // Check for range match with hyphen (e.g., "12-13")
  const rangeParts = correctStr.split('-').map(p => parseFloat(p.trim()));
  if (rangeParts.length === 2 && !isNaN(rangeParts[0]) && !isNaN(rangeParts[1])) {
    return cleanUser >= rangeParts[0] && cleanUser <= rangeParts[1];
  }

  // Float comparison with a tiny tolerance of 0.05
  const cleanCorrect = parseFloat(correctStr);
  if (!isNaN(cleanCorrect)) {
    return Math.abs(cleanUser - cleanCorrect) <= 0.05;
  }

  return false;
}

export default function QuestionCard({ 
  q, 
  selectedPaper, 
  qNumber,
  controlledAnswer,
  onAnswerChange,
  controlledShowAnswer,
  onAskMentor
}) {
  const [localAnswer, setLocalAnswer] = useState(q.question_style === 'MSQ' ? [] : '');
  const [localShowAnswer, setLocalShowAnswer] = useState(false);

  const isControlled = controlledAnswer !== undefined;
  const currentAnswer = isControlled ? controlledAnswer : localAnswer;
  const showAnswer = controlledShowAnswer !== undefined ? controlledShowAnswer : localShowAnswer;

  const parsed = parseOptions(q.question_text);
  const cleanText = parsed ? parsed.cleanText : q.question_text;
  const options = parsed ? parsed.options : [];
  const diffLabel = q.difficulty === 'H' ? 'Hard' : q.difficulty === 'M' ? 'Medium' : 'Easy';

  const correctAnswersList = q.correct_answer 
    ? q.correct_answer.split(',').map(x => x.trim().toUpperCase()).filter(Boolean) 
    : [];

  const handleSelectOption = (label) => {
    if (showAnswer) return;

    let nextAnswer;
    if (q.question_style === 'MSQ') {
      const arr = Array.isArray(currentAnswer) ? currentAnswer : [];
      if (arr.includes(label)) {
        nextAnswer = arr.filter(x => x !== label);
      } else {
        nextAnswer = [...arr, label].sort();
      }
    } else {
      nextAnswer = currentAnswer === label ? '' : label;
    }

    if (isControlled) {
      onAnswerChange(nextAnswer);
    } else {
      setLocalAnswer(nextAnswer);
    }
  };

  const handleNatChange = (val) => {
    if (showAnswer) return;
    if (isControlled) {
      onAnswerChange(val);
    } else {
      setLocalAnswer(val);
    }
  };

  const isSelected = (label) => {
    if (q.question_style === 'MSQ') {
      return Array.isArray(currentAnswer) ? currentAnswer.includes(label) : false;
    }
    return currentAnswer === label;
  };

  // Determine correctness for display
  let isNatCorrect = false;
  let isMsqMcqCorrect = false;
  if (q.question_style === 'NAT') {
    isNatCorrect = checkNatCorrectness(String(currentAnswer), q.correct_answer || '');
  } else {
    const userList = Array.isArray(currentAnswer) 
      ? currentAnswer 
      : (typeof currentAnswer === 'string' && currentAnswer ? [currentAnswer] : []);
    const cleanUser = userList.map(x => x.trim().toUpperCase()).sort().join('');
    const cleanCorrect = correctAnswersList.sort().join('');
    isMsqMcqCorrect = cleanUser === cleanCorrect && cleanCorrect.length > 0;
  }
  const isQuestionCorrect = q.question_style === 'NAT' ? isNatCorrect : isMsqMcqCorrect;

  const hasSelectedSomething = q.question_style === 'NAT'
    ? typeof currentAnswer === 'string' && currentAnswer.trim() !== ''
    : Array.isArray(currentAnswer) 
      ? currentAnswer.length > 0 
      : typeof currentAnswer === 'string' && currentAnswer.trim() !== '';

  return (
    <div className="bg-[#191c2c]/40 border border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/20 transition-all shadow-lg mb-6">
      {/* Header */}
      <div className="bg-black/20 px-5 py-3.5 border-b border-white/5 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-indigo-400">Q.{qNumber || q.question_number}</span>
          {!selectedPaper && q.paper_year && (
            <span className="text-xs px-2 py-0.5 border border-white/10 rounded text-slate-300">
              GATE CS {q.paper_year}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-semibold">
            {q.question_style}
          </span>
          <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-semibold">
            {q.marks} Mark(s)
          </span>
          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
            q.difficulty === 'H' ? 'bg-rose-500/20 text-rose-400' :
            q.difficulty === 'M' ? 'bg-amber-500/20 text-amber-400' :
            'bg-emerald-500/20 text-emerald-400'
          }`}>
            {diffLabel}
          </span>
        </div>
        {q.topic_name && (
          <span className="text-xs font-semibold text-slate-400 px-3 py-1 bg-white/5 rounded-full">
            {q.topic_name}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">{cleanText}</p>

        {/* Options for MCQ / MSQ */}
        {options.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
            {options.map((opt, oIdx) => {
              const selected = isSelected(opt.label);
              const isCorrectOpt = correctAnswersList.includes(opt.label);
              
              let borderClass = 'border-white/10 hover:border-white/20 bg-white/5';
              let labelBg = 'bg-white/10 text-indigo-300';

              if (selected) {
                borderClass = 'border-indigo-500/50 bg-indigo-500/10';
                labelBg = 'bg-indigo-500 text-white';
              }

              if (showAnswer) {
                if (isCorrectOpt) {
                  borderClass = 'border-emerald-500 bg-emerald-500/10';
                  labelBg = 'bg-emerald-500 text-white';
                } else if (selected) {
                  borderClass = 'border-rose-500 bg-rose-500/10';
                  labelBg = 'bg-rose-500 text-white';
                }
              }

              return (
                <button
                  key={oIdx}
                  disabled={showAnswer}
                  onClick={() => handleSelectOption(opt.label)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${borderClass} ${
                    !showAnswer ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
                  }`}
                >
                  <span className={`font-bold rounded-md px-2 py-0.5 text-sm ${labelBg} shrink-0`}>
                    {opt.label}
                  </span>
                  <span className="text-slate-300 text-sm leading-relaxed">{opt.text}</span>
                </button>
              );
            })}
          </div>
        ) : (q.question_style === 'MCQ' || q.question_style === 'MSQ') ? (
          <div className="mt-5 space-y-2">
            <span className="block text-xs text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
              Select Option(s) (Fallback Buttons)
            </span>
            <div className="flex flex-wrap gap-3">
              {['A', 'B', 'C', 'D'].map((label) => {
                const selected = isSelected(label);
                const isCorrectOpt = correctAnswersList.includes(label);
                
                let borderClass = 'border-white/10 hover:border-white/20 bg-white/5';
                let labelBg = 'bg-white/10 text-indigo-300';

                if (selected) {
                  borderClass = 'border-indigo-500/50 bg-indigo-500/10';
                  labelBg = 'bg-indigo-500 text-white';
                }

                if (showAnswer) {
                  if (isCorrectOpt) {
                    borderClass = 'border-emerald-500 bg-emerald-500/10';
                    labelBg = 'bg-emerald-500 text-white';
                  } else if (selected) {
                    borderClass = 'border-rose-500 bg-rose-500/10';
                    labelBg = 'bg-rose-500 text-white';
                  }
                }

                return (
                  <button
                    key={label}
                    disabled={showAnswer}
                    onClick={() => handleSelectOption(label)}
                    className={`flex items-center justify-center w-12 h-12 rounded-lg border text-base font-bold transition-all ${borderClass} ${
                      !showAnswer ? 'cursor-pointer active:scale-[0.95]' : 'cursor-default'
                    }`}
                  >
                    <span className={`rounded-md px-2 py-0.5 text-sm ${labelBg}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Numerical Answer Type (NAT) input */}
        {q.question_style === 'NAT' && (
          <div className="mt-5 max-w-xs">
            <label className="block text-xs text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
              Enter Numeric Value
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={showAnswer}
                value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                onChange={e => handleNatChange(e.target.value)}
                placeholder="e.g. 12.5"
                className={`w-full bg-black/40 border rounded-lg py-2 px-3 text-white outline-none transition-all ${
                  showAnswer
                    ? isNatCorrect
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500 bg-rose-500/10 text-rose-300'
                    : 'border-white/10 focus:border-indigo-500'
                }`}
              />
              {showAnswer && (
                <div className="absolute right-3 top-2.5">
                  {isNatCorrect ? (
                    <Check className="text-emerald-400" size={18} />
                  ) : (
                    <X className="text-rose-400" size={18} />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {q.has_diagram && (
          <div className="mt-4 flex items-center gap-2 text-amber-500/80 text-xs bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg w-fit">
            <Image size={14} /> Contains diagram / graphic content (Refer to standard papers if missing)
          </div>
        )}

        {/* Action & Feedback row */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-3">
            {/* Show local verify option for Question Browser (uncontrolled) */}
            {!isControlled && !showAnswer && (
              <button
                disabled={!hasSelectedSomething}
                onClick={() => setLocalShowAnswer(true)}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Verify Answer
              </button>
            )}

            {!isControlled && showAnswer && (
              <button
                onClick={() => {
                  setLocalShowAnswer(false);
                  setLocalAnswer(q.question_style === 'MSQ' ? [] : '');
                }}
                className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 px-4 rounded-lg border border-white/10 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            )}

            {/* Standard Answer Spoiler for fallback/reference */}
            {(!isControlled || showAnswer) && (
              <div className="relative">
                <button
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors py-2"
                  onClick={() => {
                    if (isControlled) {
                      // Allow showing answer in mock exam feedback mode
                    } else {
                      setLocalShowAnswer(prev => !prev);
                    }
                  }}
                >
                  <ChevronRight size={14} className={`transition-transform ${showAnswer ? 'rotate-90' : ''}`} />
                  {showAnswer ? 'Hide Correct Key' : 'Reveal Correct Key'}
                </button>
              </div>
            )}

            {onAskMentor && (
              <button
                onClick={() => onAskMentor(q)}
                className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Bot size={14} /> Ask AI Mentor
              </button>
            )}
          </div>

          {showAnswer && (
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border ${
              isQuestionCorrect
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {isQuestionCorrect ? <Check size={14} /> : <X size={14} />}
              {isQuestionCorrect ? 'Correct Answer!' : `Incorrect. Correct: ${q.correct_answer}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}