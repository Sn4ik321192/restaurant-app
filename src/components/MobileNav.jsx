import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, Home, MapPin, ShoppingBag, Utensils } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.jsx';

const items = [
  { to: '/', label: 'Главная', icon: Home },
  { to: '/menu', label: 'Меню', icon: Utensils },
  { to: '/booking', label: 'Бронь', icon: CalendarDays },
  { to: '/cart', label: 'Корзина', icon: ShoppingBag },
  { to: '/contacts', label: 'Контакты', icon: MapPin },
];

export default function MobileNav() {
  const { cartCount } = useRestaurant();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[28px] border border-gold/20 bg-ink/92 p-2 shadow-glow backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex min-h-14 flex-col items-center justify-center rounded-2xl text-[10px] font-bold transition ${
                isActive ? 'bg-gold text-ink' : 'text-cream/70 hover:bg-cream/8 hover:text-cream'
              }`
            }
          >
            <Icon size={19} />
            <span className="mt-1">{label}</span>
            {to === '/cart' && cartCount > 0 && (
              <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-cream px-1 text-[10px] text-ink">
                {cartCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
