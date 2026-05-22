import React from 'react';
import { Facebook, Instagram, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.jsx';

export default function Contacts() {
  const { data } = useRestaurant();
  const socialLinks = [
    { label: 'Instagram', href: data.restaurant.social.instagram, icon: Instagram },
    { label: 'Facebook', href: data.restaurant.social.facebook, icon: Facebook },
    { label: 'Telegram', href: data.restaurant.social.telegram, icon: Send },
  ];

  return (
    <section className="section-shell py-14 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="animated-shell">
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Контакты</p>
          <h1 className="mt-3 font-display text-5xl font-bold">Связаться с нами</h1>
          <div className="mt-8 space-y-4">
            <p className="flex items-center gap-3 text-cream/75"><MapPin className="text-gold" /> {data.restaurant.address}</p>
            <p className="flex items-center gap-3 text-cream/75"><Phone className="text-gold" /> {data.restaurant.phone}</p>
            <p className="flex items-center gap-3 text-cream/75"><Mail className="text-gold" /> {data.restaurant.email}</p>
          </div>
          <div className="mt-8 flex gap-3">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="grid h-12 w-12 place-items-center rounded-full border border-gold/22 text-gold transition hover:-translate-y-1 hover:bg-gold hover:text-ink" aria-label={label}>
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
        <div className="animated-shell stagger-2 grid min-h-[430px] place-items-center rounded-[30px] border border-gold/18 bg-[linear-gradient(135deg,rgba(216,179,95,0.12),rgba(20,17,14,0.92)),repeating-linear-gradient(45deg,rgba(243,231,208,0.08)_0_1px,transparent_1px_24px)] p-8 text-center shadow-glow">
          <div>
            <MapPin className="mx-auto mb-4 text-gold" size={42} />
            <p className="text-2xl font-bold">Карта-блок</p>
            <p className="mt-2 text-cream/60">{data.restaurant.address}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
