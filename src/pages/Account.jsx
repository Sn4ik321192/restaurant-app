import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import AuthRequired from '../components/AuthRequired.jsx';
import { useRestaurant } from '../context/RestaurantContext.jsx';

export default function Account() {
  const { user, isAuthenticated, isAdmin, bonusBalance, logout } = useRestaurant();

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title="Войдите в аккаунт"
        text="Аккаунт нужен, чтобы добавлять блюда, оформлять заказ и бронировать столик."
      />
    );
  }

  return (
    <section className="section-shell grid min-h-[65vh] place-items-center py-14 md:py-20">
      <div className="glass animated-shell w-full max-w-xl rounded-[28px] p-8 shadow-glow">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold">
            <UserRound size={30} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Аккаунт</p>
            <h1 className="mt-2 font-display text-4xl font-bold">Вы вошли</h1>
            <p className="mt-2 break-words text-cream/68">{user.phone}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-cream/10 bg-ink/55 p-5">
          <p className="text-sm text-cream/60">Роль аккаунта</p>
          <p className="mt-1 text-xl font-bold text-cream">{isAdmin ? 'Администратор' : 'Клиент'}</p>
        </div>

        <div className="mt-4 rounded-2xl border border-gold/18 bg-gold/10 p-5">
          <div className="flex items-center gap-3">
            <Gift className="text-gold" />
            <div>
              <p className="text-sm text-cream/60">Бонусный баланс</p>
              <p className="mt-1 text-2xl font-black text-gold">{bonusBalance} баллов</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-cream/58">
            Начисляем 5% от суммы каждого заказа. Списать можно до 30% суммы следующего заказа.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {isAdmin && (
            <Link to="/admin" className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-extrabold text-ink hover:bg-cream">
              <ShieldCheck size={18} /> Панель администратора
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/25 px-6 py-3 font-bold text-gold hover:bg-gold hover:text-ink"
          >
            <LogOut size={18} /> Выйти
          </button>
        </div>
      </div>
    </section>
  );
}
