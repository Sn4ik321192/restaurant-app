import React from 'react';
import { Clock, Gem, ShieldCheck, Users } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback.jsx';
import { useRestaurant } from '../context/RestaurantContext.jsx';

export default function About() {
  const { data } = useRestaurant();

  return (
    <section className="section-shell py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="animated-shell">
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">О ресторане</p>
          <h1 className="mt-3 font-display text-5xl font-bold">{data.restaurant.name}</h1>
          <p className="mt-6 text-lg leading-8 text-cream/72">{data.restaurant.description}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[Gem, Users, ShieldCheck].map((Icon, index) => (
              <div key={index} className="hover-lift rounded-[22px] border border-gold/14 bg-charcoal p-5">
                <Icon className="animate-floatSoft text-gold" />
                <p className="mt-4 font-bold">{data.benefits[index]}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="animated-shell stagger-2 h-[460px] overflow-hidden rounded-[30px] border border-gold/18 shadow-glow">
          <ImageWithFallback src={data.restaurant.interiorImage} alt="Интерьер ресторана" className="h-full w-full object-cover" />
        </div>
      </div>
      <div className="mt-14 rounded-[28px] border border-gold/14 bg-charcoal/72 p-6">
        <h2 className="flex items-center gap-3 text-2xl font-bold"><Clock className="text-gold" /> Часы работы</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {data.openingHours.map((row) => (
            <div key={row.day} className="rounded-2xl bg-ink/60 p-5">
              <p className="text-gold">{row.day}</p>
              <p className="mt-1 text-xl font-bold">{row.time}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
