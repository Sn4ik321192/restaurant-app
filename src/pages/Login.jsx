import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Mail, MessageCircle, Phone, ShieldCheck, UserRound } from 'lucide-react';
import FormField, { inputClass } from '../components/FormField.jsx';
import { useRestaurant } from '../context/RestaurantContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, pendingLogin, authStatus, requestEmailCode, verifyEmailCode } = useRestaurant();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || (isAdmin ? '/admin/orders' : '/');

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const sendCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    const result = await requestEmailCode(email, name);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDemoCode(result.code || '');
    setError('');
  };

  const confirmCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    const result = await verifyEmailCode(code);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate(result.user.role === 'admin' ? '/admin/orders' : '/account', { replace: true, state: { from } });
  };

  return (
    <section className="section-shell grid min-h-[70vh] place-items-center py-14 md:py-20">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="animated-shell">
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Аккаунт</p>
          <h1 className="mt-3 font-display text-5xl font-bold">Вход по почте</h1>
          <p className="mt-5 text-lg leading-8 text-cream/68">
            Введите имя и email, получите код подтверждения на почту, а затем добавьте телефон в профиле для уточнения заказов.
          </p>
          <div className="mt-7 grid gap-3 text-sm text-cream/68">
            <p className="flex items-center gap-3"><Mail className="text-gold" size={18} /> Вход без пароля: только email и одноразовый код.</p>
            <p className="flex items-center gap-3"><Phone className="text-gold" size={18} /> Телефон понадобится в профиле, чтобы ресторан мог уточнить заказ.</p>
            <p className="flex items-center gap-3"><ShieldCheck className="text-gold" size={18} /> Роль администратора определяется по email или админскому телефону в профиле.</p>
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
              <FormField label="Email">
                <input
                  required
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="alex@example.com"
                />
              </FormField>
              {error && <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</p>}
              <button disabled={loading} className="shine rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Отправляем...' : authStatus.emailEnabled ? 'Получить код на почту' : 'Получить код'}
              </button>
            </form>
          ) : (
            <form onSubmit={confirmCode} className="grid gap-5">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                <MessageCircle size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Введите код из письма</h2>
                <p className="mt-2 text-sm text-cream/60">
                  {pendingLogin.authMode === 'email'
                    ? `Код отправлен на ${pendingLogin.email}`
                    : `Демо-код создан для ${pendingLogin.email}`}
                </p>
              </div>
              <FormField label="Код подтверждения">
                <input
                  required
                  className={`${inputClass} text-center text-2xl font-extrabold tracking-[0.35em]`}
                  inputMode="numeric"
                  maxLength="6"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                />
              </FormField>
              {pendingLogin.authMode !== 'email' && (
                <div className="rounded-2xl border border-gold/20 bg-gold/10 p-4 text-sm text-gold">
                  Демо-код: <span className="font-extrabold">{demoCode || pendingLogin.code}</span>
                </div>
              )}
              {error && <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</p>}
              <button disabled={loading} className="shine rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Проверяем...' : 'Войти'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
