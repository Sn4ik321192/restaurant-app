import React from 'react';

export default function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-cream/82">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-2xl border border-gold/18 bg-ink/70 px-4 py-3 text-cream outline-none transition placeholder:text-cream/35 focus:border-gold focus:ring-4 focus:ring-gold/10';
