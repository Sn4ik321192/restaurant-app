import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LogOut, Menu as MenuIcon, ShieldCheck, ShoppingBag, Sparkles, UserRound } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.jsx';

const links = [
  { to: '/', label: 'Главная' },
  { to: '/menu', label: 'Меню' },
  { to: '/booking', label: 'Бронь' },
  { to: '/about', label: 'О ресторане' },
  { to: '/contacts', label: 'Контакты' },
];

export default function Header() {
  const { data, cartCount, user, isAdmin, logout } = useRestaurant();

  return (
    <header className="sticky top-0 z-40 border-b border-gold/10 bg-ink/88 backdrop-blur-xl">
      <div className="section-shell flex h-20 min-w-0 items-center justify-between gap-2 sm:gap-4">
        <Link to="/" className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-11 w-11 animate-pulseGold place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            {data.restaurant.logo ? <img src={data.restaurant.logo} alt="" className="h-8 w-8 rounded-full object-cover" /> : <Sparkles size={20} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-bold leading-none text-cream sm:text-xl">{data.restaurant.name}</span>
            <span className="hidden text-xs uppercase tracking-[0.28em] text-gold/75 sm:block">Premium dining</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-gold text-ink' : 'text-cream/76 hover:bg-cream/8 hover:text-cream'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/cart"
            className="relative grid h-11 w-11 place-items-center rounded-full border border-gold/25 bg-charcoal text-gold transition hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-ink"
            aria-label="Корзина"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-cream px-1 text-xs font-bold text-ink">
                {cartCount}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link
              to="/admin/orders"
              className="hidden items-center gap-2 rounded-full border border-gold/25 px-4 py-2 text-sm font-bold text-gold transition hover:bg-gold hover:text-ink sm:inline-flex"
            >
              <ShieldCheck size={17} /> Заказы
            </Link>
          )}
          {user ? (
            <div className="hidden items-center gap-2 rounded-full border border-cream/10 bg-cream/5 px-3 py-2 text-sm text-cream/75 sm:flex">
              <UserRound size={16} className="text-gold" />
              <Link to="/account" className="font-bold transition hover:text-gold">Мой профиль</Link>
              <button type="button" onClick={logout} className="grid h-7 w-7 place-items-center rounded-full text-cream/55 transition hover:bg-cream/10 hover:text-gold" aria-label="Выйти">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-2 rounded-full border border-gold/25 px-4 py-2 text-sm font-bold text-gold transition hover:bg-gold hover:text-ink sm:inline-flex"
            >
              <UserRound size={17} /> Войти
            </Link>
          )}
          <Link
            to={user ? '/account' : '/login'}
            className="grid h-11 w-11 place-items-center rounded-full border border-cream/10 text-cream/70 transition hover:border-gold hover:text-gold sm:hidden"
            aria-label={user ? 'Аккаунт' : 'Войти'}
          >
            {isAdmin ? <ShieldCheck size={20} /> : <UserRound size={20} />}
          </Link>
          <Link to="/menu" className="grid h-11 w-11 place-items-center rounded-full border border-cream/10 text-cream/70 transition hover:border-gold hover:text-gold lg:hidden" aria-label="Открыть меню">
            <MenuIcon size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
