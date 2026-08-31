import React from 'react';

export function Mascot({ mood = "idle" }: { mood?: "idle" | "happy" | "sleepy" | "working", size?: number }) {
  // Placeholder Mascot for Page build
  return (
    <svg viewBox="0 0 100 116" width="100%" height="100%" className="fjh-breathe">
      {/* Shadow */}
      <ellipse cx="50" cy="110" rx="35" ry="5" fill="rgba(122,102,70,0.15)" />
      
      {/* Body */}
      <circle cx="50" cy="70" r="30" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
      
      {/* Ears */}
      <path d="M 25 35 L 20 10 L 40 25 Z" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
      <path d="M 27 33 L 23 15 L 37 25 Z" fill="var(--rose)" />
      
      <path d="M 75 35 L 80 10 L 60 25 Z" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
      <path d="M 73 33 L 77 15 L 63 25 Z" fill="var(--rose)" />
      
      {/* Head */}
      <circle cx="50" cy="45" r="35" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
      
      {/* Sprout */}
      <path d="M 50 10 Q 55 -5 65 0" fill="none" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" />
      <path d="M 65 0 Q 70 5 60 10 Z" fill="var(--sage)" />
      
      {/* Face based on mood */}
      {mood === "happy" ? (
        <>
          <path d="M 33 45 Q 38 40 43 45" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" />
          <path d="M 57 45 Q 62 40 67 45" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : mood === "sleepy" ? (
        <>
          <path d="M 33 42 L 43 42" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" />
          <path d="M 57 42 L 67 42" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="38" cy="45" r="3" fill="var(--foreground)" className="fjh-blink" style={{ transformOrigin: "38px 45px" }} />
          <circle cx="62" cy="45" r="3" fill="var(--foreground)" className="fjh-blink" style={{ transformOrigin: "62px 45px", animationDelay: "0.1s" }} />
        </>
      )}
      
      {/* Nose and mouth */}
      <path d="M 48 53 L 52 53 L 50 56 Z" fill="var(--rose)" />
      <path d="M 50 56 Q 47 60 44 58" fill="none" stroke="var(--foreground)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 50 56 Q 53 60 56 58" fill="none" stroke="var(--foreground)" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Cheeks */}
      <ellipse cx="28" cy="53" rx="5" ry="3" fill="var(--rose)" opacity="0.3" />
      <ellipse cx="72" cy="53" rx="5" ry="3" fill="var(--rose)" opacity="0.3" />
      
      {/* Whiskers */}
      <line x1="20" y1="48" x2="10" y2="45" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="53" x2="10" y2="55" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="80" y1="48" x2="90" y2="45" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="80" y1="53" x2="90" y2="55" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Paws */}
      <ellipse cx="38" cy="98" rx="8" ry="5" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
      <ellipse cx="62" cy="98" rx="8" ry="5" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
      
      {/* Waving Paw (if happy) */}
      {mood === "happy" && (
        <g className="fjh-wave" style={{ transformOrigin: "85px 65px" }}>
          <ellipse cx="85" cy="65" rx="5" ry="10" fill="var(--card)" stroke="var(--border)" strokeWidth="2" transform="rotate(30 85 65)" />
        </g>
      )}
      
      {/* Tail */}
      <path d="M 75 85 Q 95 85 90 65 Q 85 45 100 50" fill="none" stroke="var(--card)" strokeWidth="8" strokeLinecap="round" className="fjh-tail" style={{ transformOrigin: "75px 85px" }} />
      <path d="M 75 85 Q 95 85 90 65 Q 85 45 100 50" fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round" strokeDasharray="0 1000" className="fjh-tail" style={{ transformOrigin: "75px 85px", zIndex: -1 }} />
    </svg>
  );
}
