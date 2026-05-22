import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, ShieldCheck, UserRound } from 'lucide-react';
import FormField, { inputClass } from '../components/FormField.jsx';
import { useRestaurant } from '../context/RestaurantContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, pendingLogin, requestPhoneCode, verifyPhoneCode } = useRestaurant();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [error, setError] = useState('');

  const from = location.state?.from || (isAdmin ? '/admin' : '/');

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const sendCode = (event) => {
    event.preventDefault();
    const result = requestPhoneCode(phone, name);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDemoCode(result.code);
    setError('');
  };

  const confirmCode = (event) => {
    event.preventDefault();
    const result = verifyPhoneCode(code);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate(result.user.role === 'admin' ? '/admin' : from, { replace: true });
  };

  return (
    <section className="section-shell grid min-h-[70vh] place-items-center py-14 md:py-20">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="animated-shell">
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Аккаунт</p>
          <h1 className="mt-3 font-display text-5xl font-bold">Вход по номеру телефона</h1>
          <p className="mt-5 text-lg leading-8 text-cream/68">
            Введите имя и телефон, получите код подтверждения и пользуйтесь заказами, бронью, бонусами и личным профилем.
          </p>
          <div className="mt-7 grid gap-3 text-sm text-cream/68">
            <p className="flex items-center gap-3"><Phone className="text-gold" size={18} /> Только номер телефона, без почты и пароля.</p>
            <p className="flex items-center gap-3"><ShieldCheck className="text-gold" size={18} /> Роль администратора определяется автоматически по номеру.</p>
          </div>
        </div>

        <div className="glass animated-shell stagger-2 rounded-[28px] p-6 shadow-glow">
          {!pendingLogin ? (
            <form onSubmit={sendCode} className="grid gap-5">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                <UserRound size={24} />
              </div>
              <FormField label="Имя">
                <input
                  required
                  className={inputClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Александр"
                />
              </FormField>
              <FormField label="Номер телефона">
                <input
                  required
                  className={inputClass}
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+373 68 123 456"
                />
              </FormField>
              {error && <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</p>}
              <button className="shine rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream">
                Получить код
              </button>
            </form>
          ) : (
            <form onSubmit={confirmCode} className="grid gap-5">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                <MessageCircle size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Введите код из SMS</h2>
                <p className="mt-2 text-sm text-cream/60">Код отправлен на {pendingLogin.phone}</p>
              </div>
              <FormField label="Код подтверждения">
                <input
                  required
                  className={`${inputClass} text-center text-2xl font-extrabold tracking-[0.35em]`}
                  inputMode="numeric"
                  maxLength="4"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                />
              </FormField>
              <div className="rounded-2xl border border-gold/20 bg-gold/10 p-4 text-sm text-gold">
                Демо-код: <span className="font-extrabold">{demoCode || pendingLogin.code}</span>
              </div>
              {error && <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</p>}
              <button className="shine rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream">
                Войти
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
