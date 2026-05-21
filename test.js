const renderHeatmapCell = (marks, key) => {
  const maxMark = 16;
  const pct = Math.min(1, marks / maxMark);

  let bgIntensity = 'rgba(255,255,255,0.02)';
  let textColor = 'var(--text-secondary)';
  let extraStyles = {};

  if (marks > 0) {
    if (marks <= 3) {
      // Low: Amber / yellow gradient
      bgIntensity = `linear-gradient(135deg, rgba(251, 191, 36, ${0.15 + (marks/3) * 0.25}), rgba(217, 119, 6, ${0.15 + (marks/3) * 0.25}))`;
    } else if (marks <= 7) {
      // Medium: Orange gradient
      bgIntensity = `linear-gradient(135deg, rgba(249, 115, 22, ${0.4 + ((marks-3)/4) * 0.3}), rgba(234, 88, 12, ${0.4 + ((marks-3)/4) * 0.3}))`;
      textColor = '#ffffff';
    } else {
      // Critical: Red/coral gradient
      bgIntensity = `linear-gradient(135deg, rgba(239, 68, 68, ${0.7 + ((marks-7)/9) * 0.25}), rgba(185, 28, 28, ${0.7 + ((marks-7)/9) * 0.25}))`;
      textColor = '#ffffff';
    }
  }
}
