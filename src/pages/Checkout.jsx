import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Banknote,
  CalendarClock,
  ChevronRight,
  CreditCard,
  MapPin,
  Minus,
  Phone,
  Plus,
  ReceiptText,
  Truck,
  UserRound,
  WalletCards,
} from 'lucide-react';
import AuthRequired from '../components/AuthRequired.jsx';
import FormField, { inputClass } from '../components/FormField.jsx';
import { useRestaurant } from '../context/RestaurantContext.jsx';
import { getEnabledPaymentMethods, getPaymentProvider, normalizePaymentSettings } from '../services/payments.js';

const guestOptions = [1, 2, 3, 4, 5, 6];

const paymentIcons = {
  cash: WalletCards,
  online: CreditCard,
  card: Banknote,
};

export default function Checkout() {
  const { data, cart, cartTotal, submitOrder, isAuthenticated, hasContactPhone, user, profile, bonusBalance } = useRestaurant();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [timeMode, setTimeMode] = useState('soon');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [guestCount, setGuestCount] = useState(2);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [paymentNotice, setPaymentNotice] = useState('');
  const [form, setForm] = useState({
    name: profile?.name || user?.name || '',
    email: user?.email || profile?.email || '',
    phone: profile?.phone || user?.phone || '',
    address: profile?.defaultAddressId
      ? (() => {
          const address = (profile.addresses || []).find((item) => item.id === profile.defaultAddressId);
          return address ? `${address.city}, ${address.street}, ${address.house}` : '';
        })()
      : '',
    apartment: profile?.defaultAddressId
      ? (() => {
          const address = (profile.addresses || []).find((item) => item.id === profile.defaultAddressId);
          return address ? `подъезд ${address.entrance || '-'}, этаж ${address.floor || '-'}, кв. ${address.apartment || '-'}` : '';
        })()
      : '',
    changeFrom: '',
    comment: '',
    date: '',
    time: '',
  });

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const paymentSettings = normalizePaymentSettings(data.payment);
  const enabledPaymentMethods = getEnabledPaymentMethods(paymentSettings);
  const selectedProvider = getPaymentProvider(paymentSettings.provider);
  const finalDeliveryFee = deliveryType === 'delivery' ? Number(paymentSettings.deliveryFee || 0) : 0;
  const maxBonusSpend = Math.min(bonusBalance, Math.floor((cartTotal + finalDeliveryFee) * 0.3));
  const appliedBonusPoints = Math.min(bonusPoints, maxBonusSpend);
  const payableTotal = Math.max(0, cartTotal + finalDeliveryFee - appliedBonusPoints);
  const earnedAfterOrder = Math.floor(payableTotal * 0.05);
  const minOrderAmount = Number(paymentSettings.minOrderAmount || 0);
  const belowMinOrder = minOrderAmount > 0 && cartTotal < minOrderAmount;
  const onlineProviderReady = paymentSettings.provider === 'demo' || paymentSettings.demoMode;
  const submitDisabled = belowMinOrder || (paymentMethod === 'online' && !onlineProviderReady);
  const greetingName = form.name.trim() || 'гость';
  const orderLines = useMemo(() => cart.map((item) => `${item.quantity} x ${item.name}`).join(', '), [cart]);

  useEffect(() => {
    if (bonusPoints > maxBonusSpend) {
      setBonusPoints(maxBonusSpend);
    }
  }, [bonusPoints, maxBonusSpend]);

  useEffect(() => {
    if (!enabledPaymentMethods.some((method) => method.id === paymentMethod)) {
      setPaymentMethod(enabledPaymentMethods[0]?.id || 'cash');
    }
  }, [enabledPaymentMethods, paymentMethod]);

  const onSubmit = (event) => {
    event.preventDefault();
    if (submitDisabled) {
      setPaymentNotice(
        belowMinOrder
          ? `Минимальная сумма заказа ${minOrderAmount} ${paymentSettings.currency}.`
          : 'Онлайн-оплата выбранным провайдером требует серверной интеграции. Включите Demo Pay или выберите оплату при получении.',
      );
      return;
    }

    const createdOrder = submitOrder({
      customer: form,
      items: cart,
      total: payableTotal,
      checkout: {
        deliveryType,
        timeMode,
        paymentMethod,
        paymentProvider: paymentMethod === 'online' ? paymentSettings.provider : paymentMethod,
        paymentStatus: paymentMethod === 'online' && onlineProviderReady ? 'paid' : undefined,
        currency: paymentSettings.currency,
        guestCount,
        bonusPoints: appliedBonusPoints,
        promoCode,
        deliveryFee: finalDeliveryFee,
      },
    });
    setSent(true);
    window.setTimeout(() => navigate(createdOrder?.payment?.status === 'paid' ? '/account' : '/'), 1500);
  };

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title="Войдите, чтобы оформить заказ"
        text="Заказы доступны только после входа по email-коду. Телефон понадобится уже в профиле, чтобы ресторан мог уточнить детали."
      />
    );
  }

  if (!hasContactPhone) {
    return <ContactPhoneRequired />;
  }

  if (!cart.length && !sent) {
    return (
      <section className="section-shell grid min-h-[60vh] place-items-center py-20 text-center">
        <div>
          <h1 className="font-display text-5xl font-bold">Нет блюд для заказа</h1>
          <Link to="/menu" className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 font-extrabold text-ink hover:bg-cream">
            Вернуться в меню
          </Link>
        </div>
      </section>
    );
  }

  if (sent) {
    return (
      <section className="section-shell grid min-h-[60vh] place-items-center py-20 text-center">
        <div className="glass max-w-lg rounded-[28px] p-8">
          <div className="mx-auto grid h-18 w-18 place-items-center rounded-full bg-gold/12 text-gold">
            <ReceiptText size={34} />
          </div>
          <h1 className="mt-7 font-display text-5xl font-bold">Заказ успешно отправлен</h1>
          <p className="mt-4 text-cream/60">Мы уже передали заказ ресторану.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell overflow-hidden pb-16 pt-10 md:py-16">
      <div className="mb-8 flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Checkout</p>
          <h1 className="mt-3 break-words font-display text-4xl font-bold leading-tight sm:text-5xl">Оформление заказа</h1>
          <p className="mt-3 max-w-full break-words text-cream/62">Здравствуйте, {greetingName}. Подтвердите детали доставки и оплаты.</p>
        </div>
        <Link to="/cart" className="inline-flex w-full justify-center rounded-full border border-gold/25 px-5 py-3 font-bold text-gold hover:bg-gold hover:text-ink sm:w-fit">
          Вернуться в корзину
        </Link>
      </div>

      <form onSubmit={onSubmit} className="grid min-w-0 gap-6 pb-8 md:pb-0 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <CheckoutCard>
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/12 text-gold">
                <UserRound size={26} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-cream/54">Аккаунт</p>
                <p className="break-words text-xl font-extrabold">{user?.email}</p>
                <p className="mt-1 text-sm text-cream/52">{profile?.phone || user?.phone}</p>
              </div>
            </div>
          </CheckoutCard>

          <CheckoutCard title="Способ получения">
            <SegmentedControl
              value={deliveryType}
              onChange={setDeliveryType}
              options={[
                { value: 'delivery', label: 'Доставка' },
                { value: 'pickup', label: 'Самовывоз' },
              ]}
            />

            {deliveryType === 'delivery' ? (
              <div className="mt-5 grid gap-4">
                <div className="flex items-start gap-4 rounded-2xl border border-gold/14 bg-ink/55 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cream/8 text-gold">
                    <MapPin size={22} />
                  </div>
                  <div className="grid flex-1 gap-3">
                    <input required name="address" value={form.address} onChange={update} placeholder="Город, улица, дом" className={inputClass} />
                    <input name="apartment" value={form.apartment} onChange={update} placeholder="подъезд, этаж, квартира" className={inputClass} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-gold/14 bg-ink/55 p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cream/8 text-gold">
                  <Truck size={22} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold">Забрать из ресторана</p>
                  <p className="mt-1 text-sm text-cream/48">Адрес указан на странице контактов</p>
                </div>
              </div>
            )}

            <div className="mt-5">
              <SegmentedControl
                value={timeMode}
                onChange={setTimeMode}
                options={[
                  { value: 'soon', label: 'Как можно скорее' },
                  { value: 'schedule', label: 'Дата и время' },
                ]}
              />
            </div>
            {timeMode === 'schedule' && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormField label="Дата"><input className={inputClass} type="date" name="date" value={form.date} onChange={update} required /></FormField>
                <FormField label="Время"><input className={inputClass} type="time" name="time" value={form.time} onChange={update} required /></FormField>
              </div>
            )}
          </CheckoutCard>

          <CheckoutCard title="Контактные данные">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Имя"><input required className={inputClass} name="name" value={form.name} onChange={update} placeholder="Ваше имя" /></FormField>
              <FormField label="Телефон"><input required className={inputClass} name="phone" value={form.phone} onChange={update} placeholder="Телефон" /></FormField>
              <FormField label="Email"><input required className={inputClass} type="email" name="email" value={form.email} onChange={update} placeholder="Email" /></FormField>
            </div>
          </CheckoutCard>

          <CheckoutCard title="Тип оплаты">
            <div className="grid gap-3 sm:grid-cols-3">
              {enabledPaymentMethods.map(({ id, label, detail, adminLabel }) => {
                const Icon = paymentIcons[id] || CreditCard;
                const isOnlineBlocked = id === 'online' && !onlineProviderReady;

                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => {
                      setPaymentMethod(id);
                      setPaymentNotice(isOnlineBlocked ? 'Этот провайдер показан для будущей интеграции. Для демо-оплаты включите Demo Pay в админке.' : '');
                    }}
                    className={`min-h-32 rounded-2xl border p-4 text-left transition ${
                      paymentMethod === id
                        ? isOnlineBlocked
                          ? 'border-red-300/35 bg-red-500/10 text-red-100'
                          : 'border-gold bg-gold text-ink shadow-glow'
                        : 'border-gold/14 bg-ink/60 text-cream/68 hover:border-gold/45 hover:text-cream'
                    }`}
                  >
                    <Icon size={30} />
                    <span className="mt-4 block font-extrabold">{label}</span>
                    <span className="mt-1 block text-sm opacity-70">{detail}</span>
                    <span className="mt-3 block text-xs font-bold opacity-70">{id === 'online' ? selectedProvider.label : adminLabel}</span>
                  </button>
                );
              })}
            </div>

            {paymentMethod === 'cash' && (
              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_220px] sm:items-end">
                <p className="pb-3 text-lg font-bold text-cream/82">Подготовить сдачу с:</p>
                <input className={inputClass} inputMode="numeric" name="changeFrom" value={form.changeFrom} onChange={update} placeholder="Ввести сумму" />
              </div>
            )}
            {paymentMethod === 'online' && onlineProviderReady && (
              <div className="mt-5 rounded-2xl border border-gold/18 bg-gold/10 p-4 text-sm leading-6 text-cream/72">
                <span className="font-extrabold text-gold">Demo Pay:</span> заказ будет отмечен как оплаченный без реального списания денег. Реальный maib/Paynet/Flitt/Stripe подключается через backend-webhook.
              </div>
            )}
            {paymentNotice && <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{paymentNotice}</div>}
          </CheckoutCard>

          <CheckoutCard title="Количество персон">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {guestOptions.map((count) => (
                <button
                  type="button"
                  key={count}
                  onClick={() => setGuestCount(count)}
                  className={`rounded-2xl border px-3 py-4 font-extrabold transition ${
                    guestCount === count ? 'border-gold bg-gold text-ink' : 'border-gold/14 bg-ink/60 text-cream/54 hover:border-gold/45 hover:text-cream'
                  }`}
                >
                  {count} чел.
                </button>
              ))}
            </div>
            <textarea className={`${inputClass} mt-5 min-h-32 resize-none`} name="comment" value={form.comment} onChange={update} placeholder="Ваш комментарий" />
          </CheckoutCard>

          <CheckoutCard title="Бонусы и промокод">
            {maxBonusSpend > 0 ? (
              <div className="grid gap-5 md:grid-cols-[0.75fr_1.25fr] md:items-center">
                <div>
                <p className="text-6xl font-black text-gold">{appliedBonusPoints}</p>
                  <p className="mt-2 text-sm text-cream/58">
                    баллов из {bonusBalance} доступно. Можно списать до {maxBonusSpend}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setBonusPoints(Math.max(0, bonusPoints - 1))} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/25 text-gold hover:bg-gold hover:text-ink">
                    <Minus size={18} />
                  </button>
                  <input type="range" min="0" max={maxBonusSpend} value={appliedBonusPoints} onChange={(event) => setBonusPoints(Number(event.target.value))} className="checkout-range min-w-0" />
                  <button type="button" onClick={() => setBonusPoints(Math.min(maxBonusSpend, bonusPoints + 1))} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/25 text-gold hover:bg-gold hover:text-ink">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gold/14 bg-ink/55 p-5">
                <p className="text-lg font-extrabold text-cream">Бонусов пока нет</p>
                <p className="mt-2 text-sm leading-6 text-cream/58">
                  После каждого заказа начисляется 5% от суммы к оплате. В следующих заказах можно списать до 30% суммы заказа.
                </p>
                <p className="mt-4 text-sm font-bold text-gold">За этот заказ будет начислено примерно {earnedAfterOrder} баллов.</p>
              </div>
            )}

            <button type="button" onClick={() => setPromoOpen(!promoOpen)} className="mt-6 flex w-full items-center justify-between rounded-2xl border border-gold/14 bg-ink/55 p-4 text-left hover:border-gold/45">
              <span>
                <span className="block text-lg font-extrabold">Ваш промокод</span>
                <span className="mt-1 block text-sm text-cream/50">Ввести промокод</span>
              </span>
              <ChevronRight className={`text-gold transition ${promoOpen ? 'rotate-90' : ''}`} />
            </button>
            {promoOpen && <input className={`${inputClass} mt-4 uppercase`} value={promoCode} onChange={(event) => setPromoCode(event.target.value)} placeholder="Промокод" />}
          </CheckoutCard>
        </div>

        <aside className="glass sticky top-24 mb-8 min-w-0 rounded-[28px] p-6 shadow-glow md:mb-0">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/12 text-gold">
              <ReceiptText size={24} />
            </div>
            <div>
              <p className="text-sm text-cream/52">Ваш заказ</p>
              <p className="font-extrabold">{cart.length} позиций</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <span className="text-cream/66">{item.quantity} x {item.name}</span>
                <span className="font-bold text-cream">{item.price * item.quantity} {paymentSettings.currency}</span>
              </div>
            ))}
          </div>

          <div className="my-6 border-t border-gold/12" />
          <SummaryLine label="Состав заказа" value={orderLines || 'Блюда'} muted />
          <SummaryLine label="Сумма заказа" value={`${cartTotal} ${paymentSettings.currency}`} />
          <SummaryLine label={deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'} value={`${finalDeliveryFee} ${paymentSettings.currency}`} />
          {appliedBonusPoints > 0 && <SummaryLine label="Баллы" value={`-${appliedBonusPoints} ${paymentSettings.currency}`} />}
          <SummaryLine label="Начислится бонусов" value={`+${earnedAfterOrder}`} />
          <SummaryLine
            label="Оплата"
            value={paymentMethod === 'online' ? selectedProvider.label : enabledPaymentMethods.find((method) => method.id === paymentMethod)?.adminLabel || 'При получении'}
          />

          <div className="mt-7 flex items-end justify-between gap-4">
            <p className="text-2xl font-black">К оплате</p>
            <p className="text-4xl font-black text-gold">{payableTotal}<span className="text-lg"> {paymentSettings.currency}</span></p>
          </div>
          {belowMinOrder && <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm font-bold text-red-100">Минимальная сумма заказа {minOrderAmount} {paymentSettings.currency}.</p>}

          <button disabled={submitDisabled} className="shine mt-6 w-full rounded-full bg-gold px-6 py-4 text-lg font-black text-ink transition hover:bg-cream active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55">
            Заказ подтверждаю
          </button>
          <p className="mt-4 text-center text-xs leading-5 text-cream/38">
            Вы соглашаетесь с правилами и политикой конфиденциальности
          </p>
        </aside>
      </form>
    </section>
  );
}

function ContactPhoneRequired() {
  return (
    <section className="section-shell grid min-h-[62vh] place-items-center py-14 text-center md:py-20">
      <div className="glass animated-shell max-w-lg rounded-[28px] p-8 shadow-glow">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold">
          <Phone size={28} />
        </div>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Нужен телефон</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Добавьте номер в профиле</h1>
        <p className="mt-4 leading-7 text-cream/68">
          Администратор ресторана должен иметь возможность позвонить и уточнить заказ перед приготовлением или доставкой.
        </p>
        <Link to="/account" className="shine mt-7 inline-flex rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream">
          Открыть профиль
        </Link>
      </div>
    </section>
  );
}

function CheckoutCard({ title, children }) {
  return (
    <section className="glass animated-shell min-w-0 overflow-hidden rounded-[28px] p-5 md:p-6">
      {title && <h2 className="mb-5 flex min-w-0 items-center gap-3 break-words text-2xl font-black"><CalendarClock className="shrink-0 text-gold" size={22} />{title}</h2>}
      {children}
    </section>
  );
}

function SegmentedControl({ value, onChange, options }) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-1 rounded-2xl border border-gold/14 bg-coffee/80 p-1">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-14 min-w-0 break-words rounded-xl px-2 text-sm font-black transition sm:px-3 sm:text-base ${
            value === option.value ? 'bg-gold text-ink shadow-glow' : 'text-cream/48 hover:bg-cream/8 hover:text-cream'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SummaryLine({ label, value, muted = false }) {
  return (
    <div className="mt-3 flex items-start justify-between gap-4 text-sm">
      <span className="text-cream/52">{label}</span>
      <span className={`max-w-[55%] text-right ${muted ? 'truncate text-cream/36' : 'font-bold text-cream/74'}`}>{value}</span>
    </div>
  );
}
