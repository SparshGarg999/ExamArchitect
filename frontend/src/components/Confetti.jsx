import React, { useState, useEffect } from 'react';

export default function Confetti() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate 120 confetti particles with random properties
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ff007f', '#00f5ff'];
    const generated = Array.from({ length: 120 }).map((_, i) => {
      const size = Math.random() * 8 + 6;
      return {
        id: i,
        x: Math.random() * 100, // horizontal start position percentage
        y: Math.random() * -20 - 5, // vertical start position above viewport
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.4 ? 'circle' : 'rect',
        rotation: Math.random() * 360,
        delay: Math.random() * 5, // staggered drop starts
        duration: Math.random() * 3 + 3, // duration of fall (3 to 6s)
        wobbleSpeed: Math.random() * 2 + 1,
      };
    });
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[199] overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 1;
          }
          50% {
            translateX: 15px;
          }
          100% {
            transform: translateY(115vh) rotate(720deg) translateX(-15px);
            opacity: 0.2;
          }
        }
        .confetti-particle {
          position: absolute;
          will-change: transform, opacity;
          animation-name: confetti-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}vh`,
            width: `${p.size}px`,
            height: `${p.shape === 'rect' ? p.size * 1.6 : p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '1px',
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
