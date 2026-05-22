import React, { useEffect, useState } from 'react';
import { LogOut, Plus, Save, ShieldAlert, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthRequired from '../components/AuthRequired.jsx';
import FormField, { inputClass } from '../components/FormField.jsx';
import { ORDER_STATUSES, useRestaurant } from '../context/RestaurantContext.jsx';

export default function Admin() {
  const { data, orders, isAuthenticated, isAdmin, user, logout, updateRestaurant, addDish, deleteDish, updateDishPrice, updateOrderStatus } = useRestaurant();
  const [restaurant, setRestaurant] = useState({
    name: data.restaurant.name,
    phone: data.restaurant.phone,
    address: data.restaurant.address,
  });
  const [dish, setDish] = useState({
    name: '',
    category: data.categories[0],
    description: '',
    price: '',
    image: '',
  });
  const [notice, setNotice] = useState('');
  const [priceDrafts, setPriceDrafts] = useState(() =>
    Object.fromEntries(data.menuItems.map((item) => [item.id, String(item.price)])),
  );

  useEffect(() => {
    setPriceDrafts((current) => ({
      ...Object.fromEntries(data.menuItems.map((item) => [item.id, String(item.price)])),
      ...current,
    }));
  }, [data.menuItems]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const updateRestaurantField = (event) => setRestaurant({ ...restaurant, [event.target.name]: event.target.value });
  const updateDishField = (event) => setDish({ ...dish, [event.target.name]: event.target.value });

  const saveRestaurant = (event) => {
    event.preventDefault();
    updateRestaurant(restaurant);
    showNotice('Данные ресторана сохранены');
  };

  const createDish = (event) => {
    event.preventDefault();
    addDish(dish);
    setDish({ name: '', category: data.categories[0], description: '', price: '', image: '' });
    showNotice('Блюдо добавлено в меню');
  };

  const saveDishPrice = (id) => {
    const value = priceDrafts[id];
    if (value === '') {
      setPriceDrafts((current) => ({ ...current, [id]: '0' }));
      updateDishPrice(id, 0);
      return;
    }

    updateDishPrice(id, value);
  };

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title="Войдите как администратор"
        text="Панель управления открывается только после подтверждения номера телефона администратора."
      />
    );
  }

  if (!isAdmin) {
    return (
      <section className="section-shell grid min-h-[70vh] place-items-center py-14 text-center md:py-20">
        <div className="glass animated-shell max-w-lg rounded-[28px] p-8 shadow-glow">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-red-300/20 bg-red-500/10 text-red-200">
            <ShieldAlert size={30} />
          </div>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Нет доступа</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Это клиентский аккаунт</h1>
          <p className="mt-4 leading-7 text-cream/68">
            Номер {user.phone} не входит в список администраторов. Войдите с админского номера или вернитесь на сайт.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/25 px-6 py-3 font-bold text-gold hover:bg-gold hover:text-ink"
            >
              <LogOut size={18} /> Выйти
            </button>
            <Link to="/" className="inline-flex justify-center rounded-full bg-gold px-6 py-3 font-extrabold text-ink hover:bg-cream">
              На главную
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-14 md:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Мини-админка</p>
          <h1 className="mt-3 font-display text-5xl font-bold">Управление рестораном</h1>
          <p className="mt-3 text-sm text-cream/58">Вход выполнен по номеру {user.phone}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/25 px-5 py-3 font-bold text-gold transition hover:bg-gold hover:text-ink"
        >
          <LogOut size={18} /> Выйти
        </button>
      </div>
      {notice && <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/10 p-4 font-bold text-gold">{notice}</div>}

      <div className="mt-10 rounded-[24px] border border-gold/14 bg-charcoal/78 p-4 md:p-6">
        <h2 className="mb-2 text-2xl font-bold">Заказы и статусы</h2>
        <p className="mb-5 text-sm text-cream/58">Админ или курьер меняет статус, а клиент видит уведомление в профиле.</p>
        {orders.length ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="grid gap-4 rounded-2xl border border-cream/8 bg-ink/60 p-4 lg:grid-cols-[1fr_260px] lg:items-center">
                <div>
                  <p className="font-bold">Заказ #{order.id.slice(0, 6)} · {order.customer?.name || 'Клиент'}</p>
                  <p className="mt-1 text-sm text-cream/52">{order.customer?.phone} · {order.total} MDL</p>
                  <p className="mt-2 text-sm text-gold">{(order.statusHistory || [])[0]?.label || 'Заказ обработан'}</p>
                </div>
                <select
                  className={inputClass}
                  value={order.status || 'processed'}
                  onChange={(event) => {
                    updateOrderStatus(order.id, event.target.value);
                    showNotice('Статус заказа обновлен');
                  }}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gold/14 bg-ink/60 p-6 text-center text-cream/58">Заказов пока нет.</div>
        )}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveRestaurant} className="glass animated-shell grid gap-5 rounded-[24px] p-6">
          <h2 className="text-2xl font-bold">Основные данные</h2>
          <FormField label="Название ресторана"><input className={inputClass} name="name" value={restaurant.name} onChange={updateRestaurantField} /></FormField>
          <FormField label="Телефон"><input className={inputClass} name="phone" value={restaurant.phone} onChange={updateRestaurantField} /></FormField>
          <FormField label="Адрес"><input className={inputClass} name="address" value={restaurant.address} onChange={updateRestaurantField} /></FormField>
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream">
            <Save size={18} /> Сохранить
          </button>
        </form>

        <form onSubmit={createDish} className="glass animated-shell stagger-2 grid gap-5 rounded-[24px] p-6">
          <h2 className="text-2xl font-bold">Новое блюдо</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Название"><input required className={inputClass} name="name" value={dish.name} onChange={updateDishField} /></FormField>
            <FormField label="Категория">
              <select className={inputClass} name="category" value={dish.category} onChange={updateDishField}>
                {data.categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Описание"><textarea required rows="3" className={inputClass} name="description" value={dish.description} onChange={updateDishField} /></FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Цена"><input required type="number" min="0" className={inputClass} name="price" value={dish.price} onChange={updateDishField} /></FormField>
            <FormField label="Фото URL"><input className={inputClass} name="image" value={dish.image} onChange={updateDishField} /></FormField>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream">
            <Plus size={18} /> Добавить блюдо
          </button>
        </form>
      </div>

      <div className="mt-10 rounded-[24px] border border-gold/14 bg-charcoal/78 p-4 md:p-6">
        <h2 className="mb-5 text-2xl font-bold">Меню</h2>
        <div className="space-y-3">
          {data.menuItems.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-2xl border border-cream/8 bg-ink/60 p-4 md:grid-cols-[1fr_180px_48px] md:items-center">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-sm text-gold">{item.category}</p>
              </div>
              <input
                aria-label={`Цена ${item.name}`}
                className={inputClass}
                type="number"
                min="0"
                value={priceDrafts[item.id] ?? String(item.price)}
                onChange={(event) => setPriceDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                onBlur={() => saveDishPrice(item.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Удалить блюдо "${item.name}"?`)) {
                    deleteDish(item.id);
                    showNotice('Блюдо удалено');
                  }
                }}
                className="grid h-12 w-12 place-items-center rounded-full border border-red-300/20 text-red-200 hover:bg-red-500/15"
                aria-label="Удалить блюдо"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
