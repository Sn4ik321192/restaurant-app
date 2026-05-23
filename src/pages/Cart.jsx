import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.jsx';
import ImageWithFallback from '../components/ImageWithFallback.jsx';
import AuthRequired from '../components/AuthRequired.jsx';

export default function Cart() {
  const { cart, cartTotal, updateQuantity, removeFromCart, isAuthenticated } = useRestaurant();

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title="Войдите, чтобы открыть корзину"
        text="Корзина, оформление заказа и история действий доступны после входа по email-коду."
      />
    );
  }

  if (!cart.length) {
    return (
      <section className="section-shell grid min-h-[60vh] place-items-center py-20 text-center">
        <div>
          <h1 className="font-display text-5xl font-bold text-cream">Корзина пуста</h1>
          <p className="mt-4 text-cream/68">Добавьте блюда из меню, чтобы оформить заказ.</p>
          <Link to="/menu" className="mt-7 inline-flex rounded-full bg-gold px-6 py-3 font-extrabold text-ink hover:bg-cream">
            Перейти в меню
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-14 md:py-20">
      <h1 className="font-display text-5xl font-bold text-cream">Корзина</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cart.map((item) => (
            <article key={item.id} className="glass animated-shell hover-lift grid gap-4 rounded-[24px] p-4 sm:grid-cols-[132px_1fr_auto]">
              <div className="h-32 overflow-hidden rounded-[18px]">
                <ImageWithFallback src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{item.category}</p>
                <h2 className="mt-2 text-2xl font-bold text-cream">{item.name}</h2>
                <p className="mt-2 text-sm text-cream/62">{item.price} MDL за порцию</p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <div className="flex items-center rounded-full border border-gold/20 bg-ink/60 p-1">
                  <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream/10" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Уменьшить">
                    <Minus size={16} />
                  </button>
                  <span className="w-9 text-center font-bold">{item.quantity}</span>
                  <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream/10" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Увеличить">
                    <Plus size={16} />
                  </button>
                </div>
                <button className="grid h-10 w-10 place-items-center rounded-full text-cream/58 hover:bg-red-500/15 hover:text-red-200" onClick={() => removeFromCart(item.id)} aria-label="Удалить">
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
        <aside className="glass h-fit rounded-[24px] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Итого</p>
          <p className="mt-3 text-4xl font-extrabold text-cream">{cartTotal} MDL</p>
          <Link to="/checkout" className="mt-6 flex w-full justify-center rounded-full bg-gold px-6 py-4 font-extrabold text-ink transition hover:bg-cream">
            Оформить заказ
          </Link>
        </aside>
      </div>
    </section>
  );
}
