// =================================================================
// FAYL: src/components/TiltCard.jsx
// TƏSVİR: GPU-accelerated 3D Perspektiv Tilt + Glassmorphism Glow
//         Mouse hərəkətinə reaksiya verən premium kart effekti
// =================================================================

import React, { useRef, useCallback } from 'react';

export default function TiltCard({
  children,
  className = '',
  style = {},
  intensity = 12,   // tilt dərəcəsi (max)
  glare = true,     // glow effekti
  onClick,
}) {
  const cardRef = useRef(null);
  const glowRef = useRef(null);
  const rafRef  = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;

      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2); // -1 … +1
      const dy     = (e.clientY - cy) / (rect.height / 2); // -1 … +1

      const rotateY =  dx * intensity;
      const rotateX = -dy * intensity;

      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`;

      if (glare && glowRef.current) {
        // Mouse mövqeyini CSS dəyişənlərinə ötür (radial gradient üçün)
        const mx = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
        const my = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
        glowRef.current.style.setProperty('--mx', mx + '%');
        glowRef.current.style.setProperty('--my', my + '%');
      }
    });
  }, [intensity, glare]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
  }, []);

  return (
    <div
      ref={cardRef}
      className={`tilt-card ${className}`}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99), box-shadow 0.3s ease',
        willChange: 'transform',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {glare && (
        <div
          ref={glowRef}
          className="tilt-card__glow"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
