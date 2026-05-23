import React, { useEffect, useState } from 'react';
import {
  Bell,
  CreditCard,
  Gift,
  History,
  Home,
  LogOut,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthRequired from '../components/AuthRequired.jsx';
import FormField, { inputClass } from '../components/FormField.jsx';
import { useRestaurant } from '../context/RestaurantContext.jsx';

const sections = [
  { id: 'notifications', label: 'Уведомления', icon: Bell },
  { id: 'orders', label: 'История заказов', icon: History },
  { id: 'loyalty', label: 'Программа лояльности', icon: Gift },
  { id: 'personal', label: 'Личные данные', icon: UserRound },
  { id: 'cards', label: 'Мои карты', icon: CreditCard },
  { id: 'addresses', label: 'Мои адреса', icon: MapPin },
];

const formatDate = (date) => new Date(date).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Account() {
  const {
    user,
    profile,
    isAuthenticated,
    isAdmin,
    hasContactPhone,
    contactPhone,
    bonusBalance,
    userOrders,
    notifications,
    loyaltySpend,
    currentRank,
    nextRank,
    userBonusTransactions,
    updateProfile,
    addAddress,
    deleteAddress,
    setDefaultAddress,
    addCard,
    deleteCard,
    logout,
  } = useRestaurant();
  const [activeSection, setActiveSection] = useState('notifications');
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    name: profile?.name || user?.name || '',
    phone: contactPhone || '',
    birthDate: profile?.birthDate || '',
    gender: profile?.gender || 'Не важно',
  });
  const [addressForm, setAddressForm] = useState({
    city: '',
    street: '',
    house: '',
    entrance: '',
    floor: '',
    apartment: '',
    useDefault: true,
  });
  const [cardForm, setCardForm] = useState({ number: '', holder: '', expiry: '' });
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setPersonalForm({
      name: profile?.name || user?.name || '',
      phone: profile?.phone || user?.phone || '',
      birthDate: profile?.birthDate || '',
      gender: profile?.gender || 'Не важно',
    });
  }, [profile?.name, profile?.phone, profile?.birthDate, profile?.gender, user?.name, user?.phone]);

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title="Войдите в аккаунт"
        text="Аккаунт нужен, чтобы добавлять блюда, оформлять заказ и бронировать столик."
      />
    );
  }

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  };

  const savePersonal = (event) => {
    event.preventDefault();
    updateProfile(personalForm);
    showNotice('Личные данные сохранены');
  };

  const saveAddress = (event) => {
    event.preventDefault();
    addAddress(addressForm);
    setAddressForm({ city: '', street: '', house: '', entrance: '', floor: '', apartment: '', useDefault: true });
    setAddressFormOpen(false);
    showNotice('Адрес сохранен');
  };

  const saveCard = (event) => {
    event.preventDefault();
    addCard(cardForm);
    setCardForm({ number: '', holder: '', expiry: '' });
    showNotice('Карта добавлена');
  };

  const addresses = profile?.addresses || [];
  const cards = profile?.cards || [];
  const nextRankLeft = nextRank ? Math.max(0, nextRank.threshold - loyaltySpend) : 0;
  const progress = nextRank ? Math.min(100, Math.round((loyaltySpend / nextRank.threshold) * 100)) : 100;

  return (
    <section className="section-shell py-10 md:py-16">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Мой профиль</p>
          <h1 className="mt-3 font-display text-5xl font-bold">{profile?.name || user.name || 'Гость'}</h1>
          <p className="mt-3 text-cream/62">{user.email || user.phone}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/25 px-5 py-3 font-bold text-gold transition hover:bg-gold hover:text-ink"
        >
          <LogOut size={18} /> Выйти
        </button>
      </div>

      {notice && <div className="mb-6 rounded-2xl border border-gold/25 bg-gold/10 p-4 font-bold text-gold">{notice}</div>}
      {!hasContactPhone && (
        <div className="mb-6 rounded-[24px] border border-red-300/20 bg-red-500/10 p-5">
          <p className="text-lg font-extrabold text-red-100">Добавьте номер телефона</p>
          <p className="mt-2 text-sm leading-6 text-cream/68">
            Ресторану нужен телефон, чтобы администратор мог позвонить и уточнить заказ или бронь. Оформление заказа и бронь будут доступны после сохранения номера.
          </p>
          <button
            type="button"
            onClick={() => setActiveSection('personal')}
            className="mt-4 rounded-full bg-gold px-5 py-3 font-extrabold text-ink hover:bg-cream"
          >
            Заполнить телефон
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
        <aside className="glass h-fit rounded-[28px] p-3">
          <div className="grid gap-2">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveSection(id);
                  setAddressFormOpen(false);
                }}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition ${
                  activeSection === id ? 'bg-gold text-ink' : 'text-cream/70 hover:bg-cream/8 hover:text-cream'
                }`}
              >
                <Icon size={19} /> {label}
              </button>
            ))}
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-gold hover:bg-cream/8">
                <ShieldCheck size={19} /> Панель администратора
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/orders" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-gold hover:bg-cream/8">
                <History size={19} /> Заказы
              </Link>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {activeSection === 'notifications' && (
            <ProfilePanel title="Уведомления" text="Новинки, скидки, промокоды и статусы ваших заказов.">
              <div className="grid gap-3">
                {notifications.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gold/14 bg-ink/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-extrabold text-cream">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-cream/60">{item.text}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">{item.type === 'promo' ? 'Promo' : 'Order'}</span>
                    </div>
                    {item.createdAt && <p className="mt-3 text-xs text-cream/35">{formatDate(item.createdAt)}</p>}
                  </div>
                ))}
              </div>
            </ProfilePanel>
          )}

          {activeSection === 'orders' && (
            <ProfilePanel title="История заказов" text="Все оформленные заказы и их текущий статус.">
              {userOrders.length ? (
                <div className="grid gap-4">
                  {userOrders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-gold/14 bg-ink/60 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-extrabold">Заказ #{order.id.slice(0, 6)}</p>
                          <p className="mt-1 text-sm text-cream/50">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className="w-fit rounded-full bg-gold/10 px-3 py-1 text-sm font-bold text-gold">
                          {(order.statusHistory || [])[0]?.label || 'Заказ обработан'}
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-cream/66">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between gap-4">
                            <span>{item.quantity} x {item.name}</span>
                            <span>{item.price * item.quantity} MDL</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-right text-xl font-black text-gold">{order.total} MDL</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Заказов пока нет" text="После первого заказа здесь появится история." />
              )}
            </ProfilePanel>
          )}

          {activeSection === 'loyalty' && (
            <ProfilePanel title="Программа лояльности" text="Баллы, ранг и история начислений.">
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard label="Баланс" value={`${bonusBalance} баллов`} />
                <StatCard label="Текущий ранг" value={currentRank.name} />
                <StatCard label="Потрачено" value={`${loyaltySpend} MDL`} />
              </div>
              <div className="mt-6 rounded-2xl border border-gold/14 bg-ink/60 p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-extrabold">{nextRank ? `До ${nextRank.name}` : 'Максимальный ранг'}</p>
                  <p className="text-sm text-gold">{nextRank ? `осталось ${nextRankLeft} MDL` : 'вы на вершине'}</p>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-cream/10">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                {userBonusTransactions.length ? userBonusTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between rounded-2xl border border-gold/14 bg-ink/60 p-4">
                    <div>
                      <p className="font-bold">{transaction.description}</p>
                      <p className="text-sm text-cream/45">{formatDate(transaction.createdAt)}</p>
                    </div>
                    <p className={`text-xl font-black ${transaction.amount > 0 ? 'text-gold' : 'text-red-200'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </p>
                  </div>
                )) : <EmptyState title="Истории баллов пока нет" text="Баллы появятся после первого заказа." />}
              </div>
            </ProfilePanel>
          )}

          {activeSection === 'personal' && (
            <ProfilePanel title="Личные данные" text="Имя, телефон для связи, дата рождения и пол. Эти данные можно менять в любой момент.">
              <form onSubmit={savePersonal} className="grid gap-5">
                <FormField label="Имя"><input required className={inputClass} value={personalForm.name} onChange={(event) => setPersonalForm({ ...personalForm, name: event.target.value })} /></FormField>
                <FormField label="Телефон для уточнения заказа"><input required className={inputClass} type="tel" value={personalForm.phone} onChange={(event) => setPersonalForm({ ...personalForm, phone: event.target.value })} placeholder="+373 68 123 456" /></FormField>
                <FormField label="Дата рождения"><input className={inputClass} type="date" value={personalForm.birthDate} onChange={(event) => setPersonalForm({ ...personalForm, birthDate: event.target.value })} /></FormField>
                <div>
                  <p className="mb-3 text-sm font-bold text-cream/82">Пол</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {['Мужской', 'Женский', 'Не важно'].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setPersonalForm({ ...personalForm, gender })}
                        className={`rounded-2xl border px-4 py-3 font-bold transition ${
                          personalForm.gender === gender ? 'border-gold bg-gold text-ink' : 'border-gold/14 bg-ink/60 text-cream/64 hover:border-gold/45'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="inline-flex w-fit items-center gap-2 rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream">
                  <Save size={18} /> Сохранить
                </button>
              </form>
            </ProfilePanel>
          )}

          {activeSection === 'cards' && (
            <ProfilePanel title="Мои карты" text="Сохраненные карты для оплаты заказов. В демо хранится только маска карты.">
              <form onSubmit={saveCard} className="mb-6 grid gap-4 md:grid-cols-[1fr_180px]">
                <input required className={inputClass} value={cardForm.number} onChange={(event) => setCardForm({ ...cardForm, number: event.target.value })} placeholder="Номер карты" />
                <input required className={inputClass} value={cardForm.expiry} onChange={(event) => setCardForm({ ...cardForm, expiry: event.target.value })} placeholder="MM/YY" />
                <input required className={`${inputClass} md:col-span-2`} value={cardForm.holder} onChange={(event) => setCardForm({ ...cardForm, holder: event.target.value })} placeholder="Имя на карте" />
                <button className="inline-flex w-fit items-center gap-2 rounded-full bg-gold px-6 py-3 font-extrabold text-ink hover:bg-cream md:col-span-2">
                  <Plus size={18} /> Добавить карту
                </button>
              </form>
              {cards.length ? cards.map((card) => (
                <div key={card.id} className="mb-3 flex items-center justify-between rounded-2xl border border-gold/14 bg-ink/60 p-4">
                  <div className="flex items-center gap-3">
                    <WalletCards className="text-gold" />
                    <div>
                      <p className="font-extrabold">•••• {card.last4}</p>
                      <p className="text-sm text-cream/45">{card.holder} · {card.expiry}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => deleteCard(card.id)} className="text-cream/45 hover:text-red-200"><X /></button>
                </div>
              )) : <EmptyState title="Карт пока нет" text="Добавьте карту для быстрой оплаты." />}
            </ProfilePanel>
          )}

          {activeSection === 'addresses' && (
            <ProfilePanel title="Мои адреса" text="Добавляйте несколько адресов и выбирайте адрес по умолчанию.">
              {addressFormOpen ? (
                <form onSubmit={saveAddress} className="grid gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-black">Новый адрес</h3>
                    <button type="button" onClick={() => setAddressFormOpen(false)} className="text-cream/45 hover:text-gold"><X /></button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Населенный пункт"><input required className={inputClass} value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} /></FormField>
                    <FormField label="Улица"><input required className={inputClass} value={addressForm.street} onChange={(event) => setAddressForm({ ...addressForm, street: event.target.value })} /></FormField>
                    <FormField label="Дом"><input required className={inputClass} value={addressForm.house} onChange={(event) => setAddressForm({ ...addressForm, house: event.target.value })} /></FormField>
                    <FormField label="Подъезд"><input className={inputClass} value={addressForm.entrance} onChange={(event) => setAddressForm({ ...addressForm, entrance: event.target.value })} /></FormField>
                    <FormField label="Этаж"><input className={inputClass} value={addressForm.floor} onChange={(event) => setAddressForm({ ...addressForm, floor: event.target.value })} /></FormField>
                    <FormField label="Квартира"><input className={inputClass} value={addressForm.apartment} onChange={(event) => setAddressForm({ ...addressForm, apartment: event.target.value })} /></FormField>
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl border border-gold/14 bg-ink/60 p-4 font-bold">
                    <input type="checkbox" checked={addressForm.useDefault} onChange={(event) => setAddressForm({ ...addressForm, useDefault: event.target.checked })} />
                    Использовать по умолчанию
                  </label>
                  <button className="inline-flex w-fit items-center gap-2 rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream">
                    <Save size={18} /> Сохранить
                  </button>
                </form>
              ) : (
                <>
                  <button onClick={() => setAddressFormOpen(true)} className="mb-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-extrabold text-ink hover:bg-cream">
                    <Plus size={18} /> Добавить адрес
                  </button>
                  {addresses.length ? addresses.map((address) => (
                    <div key={address.id} className="mb-3 rounded-2xl border border-gold/14 bg-ink/60 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-extrabold">{address.city}, {address.street}, {address.house}</p>
                          <p className="mt-1 text-sm text-cream/48">подъезд {address.entrance || '-'}, этаж {address.floor || '-'}, кв. {address.apartment || '-'}</p>
                        </div>
                        <button type="button" onClick={() => deleteAddress(address.id)} className="text-cream/45 hover:text-red-200"><X /></button>
                      </div>
                      <button type="button" onClick={() => setDefaultAddress(address.id)} className="mt-4 rounded-full border border-gold/20 px-4 py-2 text-sm font-bold text-gold hover:bg-gold hover:text-ink">
                        {profile?.defaultAddressId === address.id ? 'Адрес по умолчанию' : 'Сделать основным'}
                      </button>
                    </div>
                  )) : <EmptyState title="Адресов пока нет" text="Добавьте адрес для быстрой доставки." />}
                </>
              )}
            </ProfilePanel>
          )}
        </div>
      </div>
    </section>
  );
}

function ProfilePanel({ title, text, children }) {
  return (
    <section className="glass animated-shell rounded-[28px] p-5 md:p-7">
      <div className="mb-6">
        <h2 className="font-display text-4xl font-bold">{title}</h2>
        {text && <p className="mt-2 text-cream/58">{text}</p>}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-gold/14 bg-ink/60 p-5">
      <p className="text-sm text-cream/54">{label}</p>
      <p className="mt-2 text-2xl font-black text-gold">{value}</p>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-2xl border border-gold/14 bg-ink/60 p-6 text-center">
      <Home className="mx-auto text-gold" />
      <p className="mt-4 font-extrabold">{title}</p>
      <p className="mt-2 text-sm text-cream/52">{text}</p>
    </div>
  );
}
