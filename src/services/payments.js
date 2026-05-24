export const PAYMENT_METHODS = [
  {
    id: 'cash',
    label: 'Наличными',
    detail: 'при получении',
    adminLabel: 'Наличными при получении',
    pendingStatus: 'pending_on_delivery',
  },
  {
    id: 'card',
    label: 'Картой',
    detail: 'при получении',
    adminLabel: 'Картой курьеру',
    pendingStatus: 'pending_terminal',
  },
  {
    id: 'online',
    label: 'Онлайн',
    detail: 'сейчас',
    adminLabel: 'Онлайн-оплата',
    pendingStatus: 'pending',
  },
];

export const PAYMENT_PROVIDERS = [
  { id: 'demo', label: 'Demo Pay' },
  { id: 'maib', label: 'maib e-commerce' },
  { id: 'paynet', label: 'Paynet' },
  { id: 'flitt', label: 'Flitt' },
  { id: 'stripe', label: 'Stripe' },
  { id: 'custom', label: 'Custom provider' },
];

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Ожидает оплаты', tone: 'gold' },
  { value: 'pending_on_delivery', label: 'Оплата при получении', tone: 'gold' },
  { value: 'pending_terminal', label: 'Карта курьеру', tone: 'gold' },
  { value: 'requires_action', label: 'Нужно действие клиента', tone: 'gold' },
  { value: 'paid', label: 'Оплачено', tone: 'green' },
  { value: 'failed', label: 'Ошибка оплаты', tone: 'red' },
  { value: 'canceled', label: 'Отменено', tone: 'muted' },
  { value: 'refunded', label: 'Возврат', tone: 'muted' },
  { value: 'partially_refunded', label: 'Частичный возврат', tone: 'muted' },
];

export const DEFAULT_PAYMENT_SETTINGS = {
  currency: 'MDL',
  provider: 'demo',
  environment: 'test',
  demoMode: true,
  deliveryFee: 20,
  minOrderAmount: 0,
  enabledMethods: {
    cash: true,
    card: true,
    online: true,
  },
  providerPublicName: 'Demo Pay',
  webhookPath: '/functions/v1/payment-webhook',
};

export const getPaymentMethod = (method) => PAYMENT_METHODS.find((item) => item.id === method) || PAYMENT_METHODS[0];
export const getPaymentProvider = (provider) => PAYMENT_PROVIDERS.find((item) => item.id === provider) || PAYMENT_PROVIDERS[0];
export const getPaymentStatus = (status) => PAYMENT_STATUSES.find((item) => item.value === status) || PAYMENT_STATUSES[0];

export function normalizePaymentSettings(settings = {}) {
  const merged = {
    ...DEFAULT_PAYMENT_SETTINGS,
    ...settings,
    enabledMethods: {
      ...DEFAULT_PAYMENT_SETTINGS.enabledMethods,
      ...(settings.enabledMethods || {}),
    },
  };

  return {
    ...merged,
    currency: merged.currency || DEFAULT_PAYMENT_SETTINGS.currency,
    provider: merged.provider || DEFAULT_PAYMENT_SETTINGS.provider,
    environment: merged.environment || DEFAULT_PAYMENT_SETTINGS.environment,
    deliveryFee: Number(merged.deliveryFee || 0),
    minOrderAmount: Number(merged.minOrderAmount || 0),
    demoMode: Boolean(merged.demoMode || merged.provider === 'demo'),
  };
}

export function getEnabledPaymentMethods(settings = {}) {
  const normalized = normalizePaymentSettings(settings);
  return PAYMENT_METHODS.filter((method) => normalized.enabledMethods[method.id]);
}

export function createPaymentSnapshot({ id, orderId, method, amount, settings, createdAt }) {
  const normalized = normalizePaymentSettings(settings);
  const paymentMethod = getPaymentMethod(method);
  const provider = method === 'online' ? normalized.provider : method;
  const providerInfo = getPaymentProvider(provider);
  const isDemoOnline = method === 'online' && (normalized.demoMode || normalized.provider === 'demo');
  const status = isDemoOnline ? 'paid' : paymentMethod.pendingStatus;
  const paidAt = status === 'paid' ? createdAt : null;

  return {
    id,
    orderId,
    provider,
    providerLabel: method === 'online' ? providerInfo.label : paymentMethod.adminLabel,
    method,
    methodLabel: paymentMethod.adminLabel,
    status,
    statusLabel: getPaymentStatus(status).label,
    amount: Number(amount || 0),
    currency: normalized.currency,
    externalPaymentId: isDemoOnline ? `demo_${String(id).slice(0, 8)}` : '',
    externalSessionId: isDemoOnline ? `session_${String(orderId).slice(0, 8)}` : '',
    checkoutUrl: '',
    failureReason: '',
    demo: isDemoOnline,
    createdAt,
    updatedAt: createdAt,
    paidAt,
    events: [
      {
        id: `${id}-created`,
        type: isDemoOnline ? 'demo_payment_succeeded' : 'payment_created',
        status,
        label: getPaymentStatus(status).label,
        createdAt,
      },
    ],
  };
}
