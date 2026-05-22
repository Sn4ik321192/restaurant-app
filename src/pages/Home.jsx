import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, Quote, Utensils } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.jsx';
import DishCard from '../components/DishCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';

export default function Home() {
  const { data } = useRestaurant();
  const popularDishes = data.menuItems.filter((dish) => dish.popular);
  const popular = (popularDishes.length ? popularDishes : data.menuItems).slice(0, 3);

  return (
    <>
      <section className="relative min-h-[calc(100vh-80px)] overflow-hidden">
        <img src={data.restaurant.heroImage} alt="" className="absolute inset-0 h-full w-full animate-slowZoom object-cover opacity-42" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/82 to-ink/28" />
        <div className="section-shell relative z-10 grid min-h-[calc(100vh-80px)] items-center py-16 lg:grid-cols-[1fr_0.7fr]">
          <div className="animated-shell max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-ink/60 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-gold">
              <Utensils size={15} /> Restaurant template
            </p>
            <h1 className="font-display text-5xl font-bold leading-tight text-cream sm:text-6xl lg:text-7xl">
              {data.restaurant.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-cream/76">{data.restaurant.tagline}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/menu"
                className="shine inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 font-extrabold text-ink transition hover:bg-cream"
              >
                Посмотреть меню <ArrowRight size={19} />
              </Link>
              <Link
                to="/booking"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/35 bg-ink/45 px-6 py-4 font-extrabold text-cream transition hover:border-gold hover:bg-gold hover:text-ink"
              >
                <CalendarDays size={19} /> Забронировать стол
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-20">
        <SectionTitle eyebrow="Выбор гостей" title="Популярные блюда" text="Крупные фото, понятные цены и быстрый сценарий добавления в корзину." />
        {popular.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {popular.map((dish, index) => <DishCard dish={dish} key={dish.id} animationDelay={index} />)}
          </div>
        ) : (
          <div className="glass rounded-[24px] p-8 text-center text-cream/70">Популярные блюда появятся после добавления меню в админке.</div>
        )}
      </section>

      <section className="bg-charcoal/55 py-20">
        <div className="section-shell">
          <SectionTitle eyebrow="Почему выбирают" title="Преимущества" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.benefits.map((benefit) => (
              <div key={benefit} className="animated-shell hover-lift rounded-[22px] border border-gold/14 bg-ink/60 p-6 hover:border-gold/40 hover:bg-ink">
                <CheckCircle2 className="mb-5 animate-pulseGold rounded-full text-gold" />
                <p className="text-lg font-bold text-cream">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-20">
        <SectionTitle eyebrow="Отзывы" title="Гости говорят" />
        <div className="grid gap-5 md:grid-cols-3">
          {data.testimonials.map((review) => (
            <article key={review.name} className="glass hover-lift rounded-[24px] p-6">
              <Quote className="mb-5 animate-floatSoft text-gold" />
              <p className="leading-7 text-cream/75">{review.text}</p>
              <p className="mt-5 font-bold text-cream">{review.name}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
