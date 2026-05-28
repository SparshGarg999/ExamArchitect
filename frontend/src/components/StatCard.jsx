import React from 'react';

/**
 * StatCard - Reusable statistic card used in the Dashboard header.
 *
 * Props:
 *   - title: string – label for the statistic (e.g., "Database Papers").
 *   - value: string – the displayed value (e.g., "5 Years").
 *   - color: 'indigo' | 'emerald' – theme colour used for text and border.
 */
export default function StatCard({ title, value, color }) {
  const colorMap = {
    indigo: {
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/10',
    },
    emerald: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
    },
  };
  const styles = colorMap[color] || colorMap.indigo;

  return (
    <div className={`text-center ${styles.border} ${styles.bg} p-4 rounded-lg glass-panel`}> {/* glass-panel adds subtle blur */}
      <span className={`text-[10px] text-slate-400 block uppercase font-bold tracking-wider`}>{title}</span>
      <strong className={`text-xl font-extrabold ${styles.text}`}>{value}</strong>
    </div>
  );
}
