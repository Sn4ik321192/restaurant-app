import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, CreditCard, Database, Link2, LogOut, Save, ShieldAlert, WalletCards } from 'lucide-react';
import AuthRequired from '../components/AuthRequired.jsx';
import FormField, { inputClass } from '../components/FormField.jsx';
import { useRestaurant } from '../context/RestaurantContext.jsx';
import { PAYMENT_METHODS, PAYMENT_PROVIDERS, normalizePaymentSettings } from '../services/payments.js';

const methodIcons = {
  cash: WalletCards,
  card: Banknote,
  online: CreditCard,
};

const currencies = ['MDL', 'EUR', 'USD', 'RON'];

export default function AdminPayments() {
  const { data, isAuthenticated, isAdmin, user, logout, updatePaymentSettings } = useRestaurant();
  const [settings, setSettings] = useState(() => normalizePaymentSettings(data.payment));
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setSettings(normalizePaymentSettings(data.payment));
  }, [data.payment]);

  const webhookUrl = useMemo(() => {
    if (typeof window === 'undefined') return settings.webhookPath;
    return `${window.location.origin}${settings.webhookPath}`;
  }, [settings.webhookPath]);

  const update = (patch) => setSettings((current) => normalizePaymentSettings({ ...current, ...patch }));
  const updateMethod = (method, enabled) =>
    setSettings((current) =>
      normalizePaymentSettings({
        ...current,
        enabledMethods: {
          ...current.enabledMethods,
          [method]: enabled,
        },
      }),
    );

  const save = (event) => {
    event.preventDefault();
    updatePaymentSettings(settings);
    setNotice('Настройки оплаты сохранены');
    window.setTimeout(() => setNotice(''), 2200);
  };

  if (!isAuthenticated) {
    return (
      <AuthRequired
        title="Войдите как администратор"
        text="Настройки оплаты доступны только админским аккаунтам."
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
          <h1 className="mt-3 font-display text-4xl font-bold">Оплату настраивает только админ</h1>
          <p className="mt-4 leading-7 text-cream/68">
            Аккаунт {user.email || user.phone} сейчас работает как клиентский.
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
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Админ-панель</p>
          <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">Оплата</h1>
          <p className="mt-4 max-w-3xl leading-7 text-cream/62">
            Безопасная схема для продажи шаблона: клиентские карты не хранятся в приложении, а онлайн-платежи подключаются через provider и webhook.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/admin/orders" className="inline-flex justify-center rounded-full border border-gold/25 px-5 py-3 font-bold text-gold hover:bg-gold hover:text-ink">
            Заказы
          </Link>
          <Link to="/admin" className="inline-flex justify-center rounded-full border border-gold/25 px-5 py-3 font-bold text-gold hover:bg-gold hover:text-ink">
            Настройки
          </Link>
        </div>
      </div>

      {notice && <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/10 p-4 font-bold text-gold">{notice}</div>}

      <form onSubmit={save} className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="glass animated-shell rounded-[28px] p-5 md:p-6">
            <h2 className="text-2xl font-black">Способы оплаты</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = methodIcons[method.id] || CreditCard;
                const enabled = settings.enabledMethods[method.id];

                return (
                  <button
                    type="button"
                    key={method.id}
                    onClick={() => updateMethod(method.id, !enabled)}
                    className={`min-h-36 rounded-2xl border p-4 text-left transition ${
                      enabled ? 'border-gold bg-gold text-ink shadow-glow' : 'border-gold/14 bg-ink/60 text-cream/58 hover:border-gold/45 hover:text-cream'
                    }`}
                  >
                    <Icon size={30} />
                    <span className="mt-4 block text-lg font-extrabold">{method.adminLabel}</span>
                    <span className="mt-2 block text-sm opacity-70">{enabled ? 'Включено' : 'Выключено'}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="glass animated-shell rounded-[28px] p-5 md:p-6">
            <h2 className="text-2xl font-black">Провайдер онлайн-оплаты</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FormField label="Provider">
                <select className={inputClass} value={settings.provider} onChange={(event) => update({ provider: event.target.value, demoMode: event.target.value === 'demo' })}>
                  {PAYMENT_PROVIDERS.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Режим">
                <select className={inputClass} value={settings.environment} onChange={(event) => update({ environment: event.target.value })}>
                  <option value="test">Тестовый</option>
                  <option value="live">Боевой</option>
                </select>
              </FormField>
              <label className="flex items-center gap-3 rounded-2xl border border-gold/14 bg-ink/60 p-4 font-bold md:col-span-2">
                <input type="checkbox" checked={settings.demoMode} onChange={(event) => update({ demoMode: event.target.checked })} />
                Demo-оплата без списания денег
              </label>
            </div>
          </section>

          <section className="glass animated-shell rounded-[28px] p-5 md:p-6">
            <h2 className="text-2xl font-black">Правила заказа</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <FormField label="Валюта">
                <select className={inputClass} value={settings.currency} onChange={(event) => update({ currency: event.target.value })}>
                  {currencies.map((currency) => <option key={currency}>{currency}</option>)}
                </select>
              </FormField>
              <FormField label="Доставка">
                <input className={inputClass} type="number" min="0" value={settings.deliveryFee} onChange={(event) => update({ deliveryFee: event.target.value })} />
              </FormField>
              <FormField label="Минимальный заказ">
                <input className={inputClass} type="number" min="0" value={settings.minOrderAmount} onChange={(event) => update({ minOrderAmount: event.target.value })} />
              </FormField>
            </div>
          </section>
        </div>

        <aside className="glass h-fit rounded-[28px] p-5 md:p-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/12 text-gold">
            <Database size={26} />
          </div>
          <h2 className="mt-5 text-2xl font-black">Статус подключения</h2>
          <div className="mt-5 space-y-3 text-sm">
            <StatusLine label="Provider" value={PAYMENT_PROVIDERS.find((item) => item.id === settings.provider)?.label || settings.provider} />
            <StatusLine label="Режим" value={settings.environment === 'live' ? 'Боевой' : 'Тестовый'} />
            <StatusLine label="Demo" value={settings.demoMode ? 'Включено' : 'Выключено'} />
            <StatusLine label="Валюта" value={settings.currency} />
          </div>

          <div className="mt-6 rounded-2xl border border-gold/14 bg-ink/60 p-4">
            <div className="flex items-start gap-3">
              <Link2 className="mt-1 shrink-0 text-gold" size={18} />
              <div className="min-w-0">
                <p className="font-extrabold">Webhook URL</p>
                <p className="mt-2 break-all text-xs leading-5 text-cream/52">{webhookUrl}</p>
              </div>
            </div>
          </div>

          <button className="shine mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream">
            <Save size={18} /> Сохранить оплату
          </button>
        </aside>
      </form>
    </section>
  );
}

function StatusLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-gold/10 bg-ink/45 px-4 py-3">
      <span className="text-cream/48">{label}</span>
      <span className="max-w-[58%] break-words text-right font-extrabold text-cream">{value}</span>
    </div>
  );
}
