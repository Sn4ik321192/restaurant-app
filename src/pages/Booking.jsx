import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FormField, { inputClass } from '../components/FormField.jsx';
import { useRestaurant } from '../context/RestaurantContext.jsx';
import AuthRequired from '../components/AuthRequired.jsx';

export default function Booking() {
  const { submitBooking, isAuthenticated, hasContactPhone, user, profile, databaseStatus } = useRestaurant();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: profile?.name || user?.name || '', email: user?.email || profile?.email || '', phone: profile?.phone || user?.phone || '', date: '', time: '', guests: '2', comment: '' });
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const onSubmit = (event) => {
    event.preventDefault();
    submitBooking(form);
    setSent(true);
    setForm({ name: profile?.name || user?.name || '', email: user?.email || profile?.email || '', phone: profile?.phone || user?.phone || '', date: '', time: '', guests: '2', comment: '' });
  };

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title="Войдите, чтобы забронировать стол"
        text="Бронирование доступно после входа по email-коду. Затем добавьте телефон в профиле, чтобы ресторан мог подтвердить детали."
      />
    );
  }

  if (!hasContactPhone) {
    return (
      <section className="section-shell grid min-h-[62vh] place-items-center py-14 text-center md:py-20">
        <div className="glass animated-shell max-w-lg rounded-[28px] p-8 shadow-glow">
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Нужен телефон</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Добавьте номер в профиле</h1>
          <p className="mt-4 leading-7 text-cream/68">
            Для бронирования ресторану нужен контактный номер, чтобы подтвердить детали с гостем.
          </p>
          <Link to="/account" className="shine mt-7 inline-flex rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream">
            Открыть профиль
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="animated-shell">
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Бронирование</p>
          <h1 className="mt-3 font-display text-5xl font-bold">Забронировать столик</h1>
          <p className="mt-5 text-lg leading-8 text-cream/68">
            {databaseStatus.enabled
              ? 'Заявка сохраняется в общей базе данных и сразу появляется в админке.'
              : 'Заявка сохраняется в демо-режиме localStorage. После подключения Supabase она будет уходить в общую базу данных.'}
          </p>
        </div>
        <form onSubmit={onSubmit} className="glass animated-shell stagger-2 grid gap-5 rounded-[24px] p-6">
          {sent && <div className="rounded-2xl border border-gold/25 bg-gold/10 p-4 font-bold text-gold">Заявка на бронь отправлена</div>}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Имя"><input required className={inputClass} name="name" value={form.name} onChange={update} /></FormField>
            <FormField label="Телефон"><input required className={inputClass} name="phone" value={form.phone} onChange={update} /></FormField>
            <FormField label="Email"><input required type="email" className={inputClass} name="email" value={form.email} onChange={update} /></FormField>
            <FormField label="Дата"><input required type="date" className={inputClass} name="date" value={form.date} onChange={update} /></FormField>
            <FormField label="Время"><input required type="time" className={inputClass} name="time" value={form.time} onChange={update} /></FormField>
          </div>
          <FormField label="Количество гостей"><input required min="1" type="number" className={inputClass} name="guests" value={form.guests} onChange={update} /></FormField>
          <FormField label="Комментарий"><textarea className={inputClass} rows="4" name="comment" value={form.comment} onChange={update} /></FormField>
          <button className="rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream">Отправить заявку</button>
        </form>
      </div>
    </section>
  );
}
