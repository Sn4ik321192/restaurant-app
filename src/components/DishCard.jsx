import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.jsx';
import ImageWithFallback from './ImageWithFallback.jsx';

export default function DishCard({ dish, compact = false, animationDelay = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, isAuthenticated } = useRestaurant();
  const delayClass = ['stagger-1', 'stagger-2', 'stagger-3'][animationDelay % 3] || '';
  const handleAdd = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    addToCart(dish);
  };

  return (
    <article className={`animated-shell hover-lift group overflow-hidden rounded-[24px] border border-gold/14 bg-charcoal/88 shadow-glow hover:border-gold/45 ${delayClass}`}>
      <div className={compact ? 'h-44' : 'h-64'}>
        <ImageWithFallback src={dish.image} alt={dish.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">{dish.category}</p>
            <h3 className="mt-2 font-display text-2xl font-bold text-cream">{dish.name}</h3>
          </div>
          {dish.popular && <Star size={20} className="shrink-0 fill-gold text-gold" />}
        </div>
        <p className="min-h-12 text-sm leading-6 text-cream/68">{dish.description}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xl font-extrabold text-gold">{dish.price} MDL</span>
          <button
            type="button"
            onClick={handleAdd}
            className="shine inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-bold text-ink transition hover:bg-cream active:scale-95"
          >
            <Plus size={17} />
            Добавить
          </button>
        </div>
      </div>
    </article>
  );
}
