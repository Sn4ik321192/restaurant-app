import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  ClipboardList,
  Database,
  LogOut,
  MapPin,
  Phone,
  CreditCard,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import AuthRequired from '../components/AuthRequired.jsx';
import { inputClass } from '../components/FormField.jsx';
import { ORDER_STATUSES, useRestaurant } from '../context/RestaurantContext.jsx';
import { PAYMENT_STATUSES, getPaymentStatus } from '../services/payments.js';

const deliveryLabels = {
  delivery: 'Доставка',
  pickup: 'Самовывоз',
};

const paymentLabels = {
  cash: 'Наличными при получении',
  online: 'Оплатить сейчас онлайн',
  card: 'Картой при получении',
};

const timeLabels = {
  soon: 'Как можно скорее',
  schedule: 'К выбранному времени',
};

const statusFilters = [
  { value: 'active', label: 'Активные' },
  { value: 'all', label: 'Все' },
  { value: 'delivered', label: 'Доставленные' },
];

export default function AdminOrders() {
  const { orders, databaseStatus, isAuthenticated, isAdmin, user, logout, reloadDatabase, updateOrderStatus, updatePaymentStatus } = useRestaurant();
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('active');

  const filteredOrders = useMemo(() => {
    if (filter === 'delivered') return orders.filter((order) => order.status === 'delivered');
    if (filter === 'active') return orders.filter((order) => order.status !== 'delivered');
    return orders;
  }, [filter, orders]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  };

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title="Войдите как администратор"
        text="Страница заказов открывается только для админских аккаунтов после входа по email-коду."
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
          <h1 className="mt-3 font-display text-4xl font-bold">Заказы видит только админ</h1>
          <p className="mt-4 leading-7 text-cream/68">
            Аккаунт {user.email || user.phone} сейчас работает как клиентский. Админские email и телефоны задаются в настройках проекта.
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
    <section className="section-shell py-12 md:py-16">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Админ-панель</p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-6xl">Заказы</h1>
          <p className="mt-4 max-w-3xl leading-7 text-cream/62">
            Здесь администратор или курьер видит полный заказ клиента и меняет статус. Клиент получает эти статусы в уведомлениях профиля.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/25 px-5 py-3 font-bold text-gold transition hover:bg-gold hover:text-ink"
          >
            Настройки
          </Link>
          {databaseStatus.enabled && (
            <button
              type="button"
              onClick={reloadDatabase}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/25 px-5 py-3 font-bold text-gold transition hover:bg-gold hover:text-ink"
            >
              <RefreshCw size={17} /> Обновить
            </button>
          )}
        </div>
      </div>

      {notice && <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/10 p-4 font-bold text-gold">{notice}</div>}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard icon={ClipboardList} label="Всего заказов" value={orders.length} />
        <StatCard icon={CalendarClock} label="Активные" value={orders.filter((order) => order.status !== 'delivered').length} />
        <StatCard icon={CreditCard} label="Оплачено" value={orders.filter((order) => order.payment?.status === 'paid').length} />
        <StatCard icon={Database} label="Источник" value={databaseStatus.enabled ? 'Supabase' : 'Demo'} />
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`shrink-0 rounded-full border px-5 py-3 text-sm font-extrabold transition ${
              filter === item.value ? 'border-gold bg-gold text-ink' : 'border-gold/20 text-gold hover:bg-gold/10'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {filteredOrders.length ? (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={(status) => {
                updateOrderStatus(order.id, status);
                showNotice('Статус заказа обновлен');
              }}
              onPaymentStatusChange={(status) => {
                updatePaymentStatus(order.id, status);
                showNotice('Статус оплаты обновлен');
              }}
            />
          ))
        ) : (
          <div className="glass rounded-[28px] p-8 text-center text-cream/58">
            Заказов в этом разделе пока нет.
          </div>
        )}
      </div>
    </section>
  );
}

function OrderCard({ order, onStatusChange, onPaymentStatusChange }) {
  const customer = order.customer || {};
  const checkout = order.checkout || {};
  const latestStatus = (order.statusHistory || [])[0]?.label || 'Заказ обработан';
  const deliveryType = deliveryLabels[checkout.deliveryType] || checkout.deliveryType || 'Доставка';
  const paymentMethod = paymentLabels[checkout.paymentMethod] || checkout.paymentMethod || 'Не указан';
  const timeMode = timeLabels[checkout.timeMode] || checkout.timeMode || 'Как можно скорее';
  const payment = order.payment || {
    method: checkout.paymentMethod || 'cash',
    methodLabel: paymentMethod,
    providerLabel: checkout.paymentProvider || paymentMethod,
    status: checkout.paymentStatus || 'pending',
    amount: order.total || 0,
    currency: checkout.currency || 'MDL',
    events: [],
  };
  const paymentStatus = getPaymentStatus(payment.status);

  return (
    <article className="glass animated-shell rounded-[28px] p-5 md:p-6">
      <div className="grid gap-5 xl:grid-cols-[1fr_300px] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-gold">Заказ #{String(order.id).slice(0, 8)}</p>
              <h2 className="mt-2 break-words text-2xl font-black text-cream md:text-3xl">{customer.name || 'Клиент'}</h2>
              <p className="mt-2 text-sm text-cream/48">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-2xl border border-gold/16 bg-gold/10 px-4 py-3 text-sm font-extrabold text-gold">
                {latestStatus}
              </div>
              <div className={`rounded-2xl border px-4 py-3 text-sm font-extrabold ${paymentStatus.tone === 'green' ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : paymentStatus.tone === 'red' ? 'border-red-300/20 bg-red-500/10 text-red-100' : 'border-gold/16 bg-gold/10 text-gold'}`}>
                {paymentStatus.label}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <InfoRow icon={Phone} label="Телефон" value={customer.phone || 'Не указан'} />
            <InfoRow icon={UserRound} label="Email" value={customer.email || 'Не указан'} />
            <InfoRow icon={MapPin} label="Получение" value={deliveryType} />
            <InfoRow icon={ReceiptText} label="Оплата" value={`${paymentMethod} · ${paymentStatus.label}`} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <DetailBox title="Доставка и время">
              <DetailLine label="Адрес" value={checkout.deliveryType === 'pickup' ? 'Самовывоз из ресторана' : customer.address || 'Не указан'} />
              {customer.apartment && <DetailLine label="Детали" value={customer.apartment} />}
              <DetailLine label="Время" value={timeMode} />
              {customer.date && <DetailLine label="Дата" value={customer.date} />}
              {customer.time && <DetailLine label="Час" value={customer.time} />}
              <DetailLine label="Персон" value={`${checkout.guestCount || 1}`} />
            </DetailBox>

            <DetailBox title="Комментарий и промо">
              <DetailLine label="Комментарий" value={customer.comment || 'Без комментария'} />
              <DetailLine label="Промокод" value={checkout.promoCode || 'Не указан'} />
              {customer.changeFrom && <DetailLine label="Сдача с" value={`${customer.changeFrom} MDL`} />}
              <DetailLine label="Бонусы списано" value={`${order.bonus?.spent || checkout.bonusPoints || 0}`} />
              <DetailLine label="Бонусы начислено" value={`+${order.bonus?.earned || 0}`} />
            </DetailBox>

            <DetailBox title="Платеж">
              <DetailLine label="Статус" value={paymentStatus.label} />
              <DetailLine label="Провайдер" value={payment.providerLabel || payment.provider || paymentMethod} />
              <DetailLine label="Сумма" value={`${payment.amount || order.total || 0} ${payment.currency || checkout.currency || 'MDL'}`} strong />
              {payment.externalPaymentId && <DetailLine label="Payment ID" value={payment.externalPaymentId} />}
              {payment.externalSessionId && <DetailLine label="Session ID" value={payment.externalSessionId} />}
              {payment.paidAt && <DetailLine label="Оплачено" value={formatDate(payment.paidAt)} />}
            </DetailBox>
          </div>

          <div className="mt-5 rounded-2xl border border-gold/14 bg-ink/55 p-4">
            <p className="font-extrabold text-cream">Состав заказа</p>
            <div className="mt-4 space-y-3">
              {(order.items || []).map((item) => (
                <div key={`${order.id}-${item.id}`} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-cream/68">{item.quantity} x {item.name}</span>
                  <span className="shrink-0 font-bold text-cream">{Number(item.price || 0) * Number(item.quantity || 1)} MDL</span>
                </div>
              ))}
            </div>
            <div className="my-4 border-t border-gold/12" />
            <DetailLine label="Доставка" value={`${checkout.deliveryFee || 0} MDL`} />
            <DetailLine label="К оплате" value={`${order.total || 0} MDL`} strong />
          </div>
        </div>

        <aside className="rounded-[24px] border border-gold/14 bg-charcoal/72 p-4">
          <label className="text-sm font-extrabold text-cream">Статус заказа</label>
          <select className={`${inputClass} mt-3`} value={order.status || 'processed'} onChange={(event) => onStatusChange(event.target.value)}>
            {ORDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <label className="mt-5 block text-sm font-extrabold text-cream">Статус оплаты</label>
          <select className={`${inputClass} mt-3`} value={payment.status || 'pending'} onChange={(event) => onPaymentStatusChange(event.target.value)}>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <div className="mt-6">
            <p className="font-extrabold text-cream">История статусов</p>
            <div className="mt-4 space-y-3">
              {(order.statusHistory || []).map((event) => (
                <div key={`${event.status}-${event.createdAt}`} className="rounded-2xl border border-cream/8 bg-ink/55 p-3">
                  <p className="text-sm font-bold text-gold">{event.label}</p>
                  <p className="mt-1 text-xs text-cream/42">{formatDate(event.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
          {(payment.events || []).length > 0 && (
            <div className="mt-6">
              <p className="font-extrabold text-cream">История оплаты</p>
              <div className="mt-4 space-y-3">
                {(payment.events || []).map((event) => (
                  <div key={event.id || `${event.status}-${event.createdAt}`} className="rounded-2xl border border-cream/8 bg-ink/55 p-3">
                    <p className="text-sm font-bold text-gold">{event.label || event.status}</p>
                    <p className="mt-1 text-xs text-cream/42">{formatDate(event.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[24px] border border-gold/14 bg-charcoal/76 p-5">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/12 text-gold">
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm text-cream/50">{label}</p>
          <p className="text-2xl font-black text-cream">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-gold/14 bg-ink/55 p-4">
      <Icon className="mt-0.5 shrink-0 text-gold" size={20} />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cream/34">{label}</p>
        <p className="mt-1 break-words font-bold text-cream">{value}</p>
      </div>
    </div>
  );
}

function DetailBox({ title, children }) {
  return (
    <div className="rounded-2xl border border-gold/14 bg-ink/55 p-4">
      <p className="font-extrabold text-cream">{title}</p>
      <div className="mt-4 space-y-2">{children}</div>
    </div>
  );
}

function DetailLine({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-cream/45">{label}</span>
      <span className={`max-w-[62%] break-words text-right ${strong ? 'text-lg font-black text-gold' : 'font-bold text-cream/76'}`}>{value}</span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'Дата не указана';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
