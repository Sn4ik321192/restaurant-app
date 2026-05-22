import React from 'react';

export default function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">{eyebrow}</p>}
      <h2 className="mt-3 font-display text-4xl font-bold text-cream md:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-base leading-7 text-cream/68">{text}</p>}
    </div>
  );
}
