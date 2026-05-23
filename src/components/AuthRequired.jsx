import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';

export default function AuthRequired({ title, text }) {
  const location = useLocation();

  return (
    <section className="section-shell grid min-h-[62vh] place-items-center py-14 text-center md:py-20">
      <div className="glass animated-shell max-w-lg rounded-[28px] p-8 shadow-glow">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold">
          <LockKeyhole size={28} />
        </div>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Требуется вход</p>
        <h1 className="mt-3 font-display text-4xl font-bold">{title}</h1>
        <p className="mt-4 leading-7 text-cream/68">{text}</p>
        <Link
          to="/login"
          state={{ from: location.pathname }}
          className="shine mt-7 inline-flex rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream"
        >
          Войти по почте
        </Link>
      </div>
    </section>
  );
}
