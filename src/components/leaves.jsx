import React, { useState, useCallback, useEffect, useRef } from 'react';

const FLOWERS = ['🌸', '🌺', '🌹', '🌷', '🌻', '🌼', '💐', '🌸', '🌺', '🌹'];
const COLORS = [
  '#ff6b9d', '#c44569', '#e056a0', '#f8a5c2',
  '#ffb347', '#ff9ff3', '#a29bfe', '#fd79a8',
  '#e77f67', '#f19066', '#e15f41', '#f3a683'
];

function createFlowers(x, y, count = 20) {
  const flowers = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = 60 + Math.random() * 200;
    flowers.push({
      id: Math.random().toString(36).slice(2),
      x,
      y,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist - 60,
      rotation: Math.random() * 720 - 360,
      size: 16 + Math.random() * 24,
      emoji: FLOWERS[Math.floor(Math.random() * FLOWERS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.12,
      duration: 0.8 + Math.random() * 0.6,
    });
  }
  return flowers;
}

function FlowerParticle({ flower, triggered }) {
  const base = {
    position: 'fixed',
    left: flower.x - flower.size / 2,
    top: flower.y - flower.size / 2,
    width: flower.size,
    height: flower.size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: flower.size,
    lineHeight: 1,
    pointerEvents: 'none',
    zIndex: 9999,
    transform: 'translate(0, 0) rotate(0deg) scale(1)',
    opacity: 0,
    transition: 'none',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
  };

  if (triggered) {
    return (
      <div
        style={{
          ...base,
          opacity: 1,
          transform: `translate(${flower.tx}px, ${flower.ty}px) rotate(${flower.rotation}deg) scale(0.3)`,
          transition: `transform ${flower.duration}s cubic-bezier(.25,.46,.45,.94) ${flower.delay}s, opacity ${flower.duration * 0.5}s ease ${flower.delay + 0.3}s`,
        }}
      >
        {flower.emoji}
      </div>
    );
  }

  return <div style={base}>{flower.emoji}</div>;
}

export default function FlowerExplosion() {
  const [explosions, setExplosions] = useState([]);
  const [triggered, setTriggered] = useState({});
  const rafRef = useRef(null);

  const handleClick = useCallback((e) => {
    const flowers = createFlowers(e.clientX, e.clientY);

    setExplosions(prev => [...prev, ...flowers]);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setTriggered(prev => {
          const next = { ...prev };
          flowers.forEach(f => { next[f.id] = true; });
          return next;
        });
      });
    });

    setTimeout(() => {
      setExplosions(prev => prev.filter(f => !flowers.find(nf => nf.id === f.id)));
    }, 2000);
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleClick]);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {explosions.map(flower => (
        <FlowerParticle key={flower.id} flower={flower} triggered={triggered[flower.id] || false} />
      ))}
    </div>
  );
}
