import React from 'react';

export function CozyScene() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--sky-top)] to-[var(--background)] opacity-60" />
      
      {/* Sun glow top right */}
      <div className="absolute -top-[10%] -right-[5%] w-[60vw] h-[60vw] rounded-full blur-[100px] bg-[var(--sun)] opacity-70 fjh-sun" />
      
      {/* Cool glow bottom left */}
      <div className="absolute -bottom-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[100px] bg-[var(--sky)] opacity-40 mix-blend-multiply dark:mix-blend-screen" />
      
      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(122,102,70,0.03)]" />
      
      {/* We'll add SVG clouds and plants when Mascot agent finishes them. For now this fulfills layout requirements */}
    </div>
  );
}
