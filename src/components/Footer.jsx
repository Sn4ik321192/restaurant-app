import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.jsx';

export default function Footer() {
  const { data } = useRestaurant();

  return (
    <footer className="border-t border-gold/10 bg-ink/70 py-10">
      <div className="section-shell grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <h2 className="font-display text-3xl font-bold text-cream">{data.restaurant.name}</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-cream/66">{data.restaurant.description}</p>
        </div>
        <div className="space-y-3 text-sm text-cream/72">
          <p className="flex items-center gap-2"><Phone size={16} className="text-gold" />{data.restaurant.phone}</p>
          <p className="flex items-center gap-2"><Mail size={16} className="text-gold" />{data.restaurant.email}</p>
          <p className="flex items-center gap-2"><Instagram size={16} className="text-gold" />@restaurant.app</p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <Link className="rounded-full bg-cream/8 px-4 py-2 text-sm text-cream/76 transition hover:bg-gold hover:text-ink" to="/menu">
            Меню
          </Link>
          <Link className="rounded-full bg-cream/8 px-4 py-2 text-sm text-cream/76 transition hover:bg-gold hover:text-ink" to="/booking">
            Забронировать
          </Link>
        </div>
      </div>
    </footer>
  );
}
