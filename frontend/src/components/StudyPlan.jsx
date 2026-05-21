import React from 'react';
import { Calendar, CheckCircle } from 'lucide-react';

export function getFallbackPlan(days) {
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

function StudyPlan({
  activeTab,
  studyPlanDays,
  setStudyPlanDays,
  studyPlanWeaknesses,
  setStudyPlanWeaknesses,
  handleUpdateStudyPlan,
  examTopics,
  handleToggleWeakness,
  studyPlan
}) {
  return (
    <>
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
    </>
  );
}

export default StudyPlan;
