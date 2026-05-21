import React from 'react';
import {
  ChevronRight,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';

function Dashboard({
  activeTab,
  heatmapData,
  seeding,
  handleReseed,
  expandedSubjects,
  handleToggleSubject,
  handleToggleWeakness,
  subtopicHeatmaps,
  renderHeatmapCell,
  selectedHeatmapTopic,
  setSelectedHeatmapTopic,
  topicDetailsRef,
  predictions,
  trendChartData,
  trendChartOptions
}) {
  return (
    <>
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
    </>
  );
}

export default Dashboard;
