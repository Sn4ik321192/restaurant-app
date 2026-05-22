import React, { useMemo, useState } from 'react';
import DishCard from '../components/DishCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import { useRestaurant } from '../context/RestaurantContext.jsx';

export default function Menu() {
  const { data } = useRestaurant();
  const [category, setCategory] = useState('Все');
  const categories = ['Все', ...data.categories];
  const dishes = useMemo(
    () => (category === 'Все' ? data.menuItems : data.menuItems.filter((dish) => dish.category === category)),
    [category, data.menuItems],
  );

  return (
    <section className="section-shell py-14 md:py-20">
      <SectionTitle eyebrow="Меню" title="Блюда ресторана" text="Категории, цены и карточки можно заменить в одном файле или через админку." />
      <div className="mb-8 flex gap-2 overflow-x-auto pb-3">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full px-5 py-3 text-sm font-extrabold transition ${
              category === item ? 'bg-gold text-ink' : 'border border-gold/18 bg-charcoal text-cream/72 hover:border-gold hover:text-cream'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {dishes.map((dish, index) => <DishCard dish={dish} key={dish.id} animationDelay={index} />)}
      </div>
      {!dishes.length && (
        <div className="glass rounded-[24px] p-8 text-center text-cream/70">
          В этой категории пока нет блюд. Добавьте позиции в админке или выберите другую категорию.
        </div>
      )}
    </section>
  );
}
