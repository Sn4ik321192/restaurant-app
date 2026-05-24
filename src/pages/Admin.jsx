import React, { useEffect, useState } from 'react';
import { ClipboardList, CreditCard, Database, LogOut, Plus, RefreshCw, Save, ShieldAlert, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthRequired from '../components/AuthRequired.jsx';
import FormField, { inputClass } from '../components/FormField.jsx';
import { useRestaurant } from '../context/RestaurantContext.jsx';

export default function Admin() {
  const {
    data,
    bookings,
    databaseStatus,
    isAuthenticated,
    isAdmin,
    user,
    logout,
    updateRestaurant,
    addDish,
    deleteDish,
    updateDishPrice,
    reloadDatabase,
  } = useRestaurant();
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
      ...current,
      ...Object.fromEntries(data.menuItems.map((item) => [item.id, String(item.price)])),
    }));
  }, [data.menuItems]);

  useEffect(() => {
    setRestaurant({
      name: data.restaurant.name,
      phone: data.restaurant.phone,
      address: data.restaurant.address,
    });
  }, [data.restaurant.name, data.restaurant.phone, data.restaurant.address]);

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
        text="Панель управления открывается только для админских аккаунтов после входа по email-коду."
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
            Аккаунт {user.email || user.phone} не входит в список администраторов. Войдите с админской почты или добавьте админский телефон в профиле.
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
          <p className="mt-3 text-sm text-cream/58">Вход выполнен как {user.email || user.phone}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/admin/orders"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 font-extrabold text-ink transition hover:bg-cream"
          >
            <ClipboardList size={18} /> Заказы
          </Link>
          <Link
            to="/admin/payments"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/25 px-5 py-3 font-bold text-gold transition hover:bg-gold hover:text-ink"
          >
            <CreditCard size={18} /> Оплата
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/25 px-5 py-3 font-bold text-gold transition hover:bg-gold hover:text-ink"
          >
            <LogOut size={18} /> Выйти
          </button>
        </div>
      </div>
      {notice && <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/10 p-4 font-bold text-gold">{notice}</div>}

      <div className="mt-8 flex flex-col gap-4 rounded-[24px] border border-gold/14 bg-charcoal/78 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold/12 text-gold">
            <Database size={22} />
          </div>
          <div>
            <p className="font-extrabold">Демо-база данных</p>
            <p className="mt-1 text-sm text-cream/58">
              {databaseStatus.enabled
                ? databaseStatus.connected
                  ? 'Supabase подключен. Данные синхронизируются между клиентами и админкой.'
                  : databaseStatus.loading
                    ? 'Подключаемся к Supabase...'
                    : 'Supabase включен, но сейчас есть ошибка подключения.'
                : 'Сейчас работает демо-режим localStorage. После настройки .env данные будут уходить в Supabase.'}
            </p>
            {databaseStatus.error && <p className="mt-2 text-sm font-bold text-red-200">{databaseStatus.error}</p>}
          </div>
        </div>
        {databaseStatus.enabled && (
          <button
            type="button"
            onClick={reloadDatabase}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/25 px-5 py-3 font-bold text-gold transition hover:bg-gold hover:text-ink"
          >
            <RefreshCw size={17} /> Обновить из БД
          </button>
        )}
      </div>

      <div className="mt-10 rounded-[24px] border border-gold/14 bg-charcoal/78 p-4 md:p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="mb-2 text-2xl font-bold">Рабочий экран заказов</h2>
            <p className="text-sm leading-6 text-cream/58">
              Все данные клиента, состав заказа, адрес, способ оплаты, комментарий и смена статусов вынесены на отдельную страницу.
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 font-extrabold text-ink transition hover:bg-cream"
          >
            <ClipboardList size={18} /> Открыть заказы
          </Link>
        </div>
      </div>

      <div className="mt-10 rounded-[24px] border border-gold/14 bg-charcoal/78 p-4 md:p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="mb-2 text-2xl font-bold">Оплата и провайдеры</h2>
            <p className="text-sm leading-6 text-cream/58">
              Валюта, доставка, минимальная сумма заказа, Demo Pay и будущие подключения maib, Paynet, Flitt или Stripe вынесены в отдельный модуль.
            </p>
          </div>
          <Link
            to="/admin/payments"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 font-extrabold text-ink transition hover:bg-cream"
          >
            <CreditCard size={18} /> Настроить оплату
          </Link>
        </div>
      </div>

      <div className="mt-10 rounded-[24px] border border-gold/14 bg-charcoal/78 p-4 md:p-6">
        <h2 className="mb-2 text-2xl font-bold">Брони столиков</h2>
        <p className="mb-5 text-sm text-cream/58">Заявки клиентов на дату, время и количество гостей.</p>
        {bookings.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-cream/8 bg-ink/60 p-4">
                <p className="font-bold">{booking.name || 'Гость'} · {booking.guests} гостей</p>
                <p className="mt-1 text-sm text-cream/52">{booking.phone}</p>
                <p className="mt-3 text-gold">{booking.date} · {booking.time}</p>
                {booking.comment && <p className="mt-3 text-sm leading-6 text-cream/58">{booking.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gold/14 bg-ink/60 p-6 text-center text-cream/58">Броней пока нет.</div>
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
