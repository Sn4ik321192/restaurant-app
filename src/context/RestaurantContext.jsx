import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { restaurantData } from '../data.js';
import {
  databaseMode,
  deleteMenuItem as deleteMenuItemFromDatabase,
  ensureDatabaseSeed,
  fetchDatabaseState,
  isRemoteDatabaseEnabled,
  saveBooking as saveBookingToDatabase,
  saveMenuItem,
  saveOrder as saveOrderToDatabase,
  saveProfile as saveProfileToDatabase,
  saveRestaurantSettings,
  updateOrderStatus as updateOrderStatusInDatabase,
  updatePaymentStatus as updatePaymentStatusInDatabase,
} from '../services/database.js';
import {
  authMode,
  getAuthUser,
  isEmailAuthEnabled,
  sendEmailCode as sendAuthEmailCode,
  verifyEmailCode as verifyAuthEmailCode,
} from '../services/auth.js';
import { createPaymentSnapshot, getPaymentStatus, normalizePaymentSettings } from '../services/payments.js';

const STORAGE_KEYS = {
  restaurant: 'restaurant-app-data',
  cart: 'restaurant-app-cart',
  orders: 'restaurant-app-orders',
  bookings: 'restaurant-app-bookings',
  authUser: 'restaurant-app-auth-user',
  pendingLogin: 'restaurant-app-pending-login',
  bonusAccounts: 'restaurant-app-bonus-accounts',
  bonusTransactions: 'restaurant-app-bonus-transactions',
  profiles: 'restaurant-app-profiles',
};

export const ORDER_STATUSES = [
  { value: 'processed', label: 'Заказ обработан' },
  { value: 'cooking', label: 'Заказ готовится' },
  { value: 'delivering', label: 'Заказ передан курьеру' },
  { value: 'delivered', label: 'Заказ доставлен' },
];

export const LOYALTY_RANKS = [
  { name: 'Bronze', threshold: 0 },
  { name: 'Silver', threshold: 1000 },
  { name: 'Gold', threshold: 3000 },
  { name: 'Platinum', threshold: 7000 },
];

const RestaurantContext = createContext(null);

export const isBirthdayToday = (birthDate, referenceDate = new Date()) => {
  const [year, month, day] = String(birthDate || '').split('T')[0].split('-').map(Number);

  if (!year || !month || !day) return false;

  return referenceDate.getMonth() + 1 === month && referenceDate.getDate() === day;
};

const createBirthdayGreeting = (profile, user) => {
  if (!user || !isBirthdayToday(profile?.birthDate)) return null;

  const name = profile?.name || user?.name || 'гость';
  const year = new Date().getFullYear();

  return {
    id: `birthday-${year}`,
    title: `С днем рождения, ${name}!`,
    text: 'Желаем теплого дня, вкусного настроения и приятных моментов. Ваш ресторан приготовил для вас персональное поздравление.',
    type: 'birthday',
    createdAt: new Date().toISOString(),
    year,
    name,
  };
};

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const normalizePhone = (phone = '') => phone.replace(/\D/g, '');
export const normalizeEmail = (email = '') => email.trim().toLowerCase();

const normalizeAccountKey = (value = '') => {
  const text = String(value).trim();
  return text.includes('@') ? normalizeEmail(text) : normalizePhone(text);
};

const createDemoCode = () => String(Math.floor(100000 + Math.random() * 900000));

const mergeData = (savedData) => ({
  ...restaurantData,
  ...savedData,
  admin: {
    ...restaurantData.admin,
    ...(savedData?.admin || {}),
  },
  restaurant: {
    ...restaurantData.restaurant,
    ...(savedData?.restaurant || {}),
  },
  payment: normalizePaymentSettings({
    ...restaurantData.payment,
    ...(savedData?.payment || {}),
  }),
  categories: Array.isArray(savedData?.categories) ? savedData.categories : restaurantData.categories,
  menuItems: Array.isArray(savedData?.menuItems) ? savedData.menuItems : restaurantData.menuItems,
  benefits: Array.isArray(savedData?.benefits) ? savedData.benefits : restaurantData.benefits,
  testimonials: Array.isArray(savedData?.testimonials) ? savedData.testimonials : restaurantData.testimonials,
  openingHours: Array.isArray(savedData?.openingHours) ? savedData.openingHours : restaurantData.openingHours,
});

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // LocalStorage may be blocked or full; the app should keep working in memory.
  }
};

export function RestaurantProvider({ children }) {
  const [data, setData] = useState(() => mergeData(readStorage(STORAGE_KEYS.restaurant, restaurantData)));
  const [cart, setCart] = useState(() => readStorage(STORAGE_KEYS.cart, []));
  const [user, setUser] = useState(() => readStorage(STORAGE_KEYS.authUser, null));
  const [profiles, setProfiles] = useState(() => readStorage(STORAGE_KEYS.profiles, {}));
  const [orders, setOrders] = useState(() => readStorage(STORAGE_KEYS.orders, []));
  const [bookings, setBookings] = useState(() => readStorage(STORAGE_KEYS.bookings, []));
  const [bonusAccounts, setBonusAccounts] = useState(() => readStorage(STORAGE_KEYS.bonusAccounts, {}));
  const [bonusTransactions, setBonusTransactions] = useState(() => readStorage(STORAGE_KEYS.bonusTransactions, []));
  const [pendingLogin, setPendingLogin] = useState(() => readStorage(STORAGE_KEYS.pendingLogin, null));
  const [databaseStatus, setDatabaseStatus] = useState({
    mode: databaseMode,
    enabled: isRemoteDatabaseEnabled,
    connected: false,
    loading: isRemoteDatabaseEnabled,
    error: '',
  });
  const authStatus = {
    mode: authMode,
    emailEnabled: isEmailAuthEnabled,
  };

  const pushRemote = (operation, { throwOnError = false } = {}) => {
    if (!isRemoteDatabaseEnabled || !operation) return Promise.resolve();

    return Promise.resolve()
      .then(operation)
      .then(() => {
        setDatabaseStatus((current) => ({ ...current, connected: true, loading: false, error: '' }));
      })
      .catch((error) => {
        setDatabaseStatus((current) => ({
          ...current,
          connected: false,
          loading: false,
          error: error.message || 'Database sync error',
        }));
        if (throwOnError) {
          throw error;
        }
      });
  };

  const importRemoteState = (remoteState) => {
    if (!remoteState) return;

    const nextData = mergeData(remoteState.data || restaurantData);
    setData(nextData);
    writeStorage(STORAGE_KEYS.restaurant, nextData);

    setProfiles(remoteState.profiles || {});
    writeStorage(STORAGE_KEYS.profiles, remoteState.profiles || {});

    setOrders(remoteState.orders || []);
    writeStorage(STORAGE_KEYS.orders, remoteState.orders || []);

    setBookings(remoteState.bookings || []);
    writeStorage(STORAGE_KEYS.bookings, remoteState.bookings || []);

    setBonusAccounts(remoteState.bonusAccounts || {});
    writeStorage(STORAGE_KEYS.bonusAccounts, remoteState.bonusAccounts || {});

    setBonusTransactions(remoteState.bonusTransactions || []);
    writeStorage(STORAGE_KEYS.bonusTransactions, remoteState.bonusTransactions || []);
  };

  const reloadDatabase = async () => {
    if (!isRemoteDatabaseEnabled) return;

    setDatabaseStatus((current) => ({ ...current, loading: true, error: '' }));
    try {
      await ensureDatabaseSeed(restaurantData);
      const remoteState = await fetchDatabaseState();
      importRemoteState(remoteState);
      setDatabaseStatus((current) => ({ ...current, connected: true, loading: false, error: '' }));
    } catch (error) {
      setDatabaseStatus((current) => ({
        ...current,
        connected: false,
        loading: false,
        error: error.message || 'Database loading error',
      }));
    }
  };

  useEffect(() => {
    reloadDatabase();
    // Run once on startup: remote DB becomes the shared source of truth when enabled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistData = (nextData) => {
    setData(nextData);
    writeStorage(STORAGE_KEYS.restaurant, nextData);
    return pushRemote(() => saveRestaurantSettings(nextData), { throwOnError: true });
  };

  const persistCart = (nextCart) => {
    setCart(nextCart);
    writeStorage(STORAGE_KEYS.cart, nextCart);
  };

  const persistProfiles = (nextProfiles) => {
    setProfiles(nextProfiles);
    writeStorage(STORAGE_KEYS.profiles, nextProfiles);
  };

  const persistOrders = (nextOrders) => {
    setOrders(nextOrders);
    writeStorage(STORAGE_KEYS.orders, nextOrders);
  };

  const persistBookings = (nextBookings) => {
    setBookings(nextBookings);
    writeStorage(STORAGE_KEYS.bookings, nextBookings);
  };

  const persistBonusAccounts = (nextAccounts) => {
    setBonusAccounts(nextAccounts);
    writeStorage(STORAGE_KEYS.bonusAccounts, nextAccounts);
  };

  const persistBonusTransactions = (nextTransactions) => {
    setBonusTransactions(nextTransactions);
    writeStorage(STORAGE_KEYS.bonusTransactions, nextTransactions);
  };

  const persistPendingLogin = (login) => {
    setPendingLogin(login);
    writeStorage(STORAGE_KEYS.pendingLogin, login);
  };

  const clearPendingLogin = () => {
    setPendingLogin(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.pendingLogin);
    } catch {
      // Ignore storage errors; the in-memory state is already cleared.
    }
  };

  const getUserKey = (targetUser = user) => targetUser?.accountKey || targetUser?.normalizedPhone || normalizeAccountKey(targetUser?.email || targetUser?.phone || '');

  const isAdminAccount = (targetUser) => {
    const email = normalizeEmail(targetUser?.email || '');
    const phone = normalizePhone(targetUser?.phone || targetUser?.normalizedPhone || '');
    const envAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(normalizeEmail).filter(Boolean);
    const envAdminPhones = (import.meta.env.VITE_ADMIN_PHONES || '').split(',').map(normalizePhone).filter(Boolean);
    const adminEmails = [...(data.admin.emails || []).map(normalizeEmail), ...envAdminEmails];
    const adminPhones = [...(data.admin.phoneNumbers || []).map(normalizePhone), ...envAdminPhones];

    return Boolean((email && adminEmails.includes(email)) || (phone && adminPhones.includes(phone)));
  };

  const getBonusBalance = (accountKey = getUserKey()) => {
    const key = normalizeAccountKey(accountKey);
    if (!key) return 0;
    return Number(bonusAccounts[key] || 0);
  };

  const getProfile = (accountKey = getUserKey()) => {
    const key = normalizeAccountKey(accountKey);
    if (!key) return null;
    return profiles[key] || null;
  };

  const updateProfile = (updates) => {
    const accountKey = getUserKey();
    if (!accountKey) return;

    const currentProfile = getProfile() || {};
    const nextProfile = {
      ...currentProfile,
      ...updates,
      email: user.email || currentProfile.email || '',
      phone: updates.phone ?? currentProfile.phone ?? user.phone ?? '',
      normalizedPhone: accountKey,
      updatedAt: new Date().toISOString(),
    };
    nextProfile.role = isAdminAccount({ ...user, email: nextProfile.email, phone: nextProfile.phone }) ? 'admin' : nextProfile.role || 'client';
    const nextProfiles = { ...profiles, [accountKey]: nextProfile };
    const nextUser = {
      ...user,
      name: nextProfile.name || user.name,
      phone: nextProfile.phone,
      normalizedPhone: accountKey,
      accountKey,
      role: nextProfile.role,
    };

    persistProfiles(nextProfiles);
    setUser(nextUser);
    writeStorage(STORAGE_KEYS.authUser, nextUser);
    pushRemote(() => saveProfileToDatabase(nextProfile));
  };

  const addAddress = (address) => {
    if (!getUserKey()) return;
    const currentProfile = getProfile() || {};
    const addressWithId = { ...address, id: createId(), createdAt: new Date().toISOString() };
    const addresses = [...(currentProfile.addresses || []), addressWithId];
    updateProfile({
      addresses,
      defaultAddressId: address.useDefault || !currentProfile.defaultAddressId ? addressWithId.id : currentProfile.defaultAddressId,
    });
  };

  const deleteAddress = (id) => {
    const currentProfile = getProfile() || {};
    const addresses = (currentProfile.addresses || []).filter((address) => address.id !== id);
    updateProfile({
      addresses,
      defaultAddressId: currentProfile.defaultAddressId === id ? addresses[0]?.id || null : currentProfile.defaultAddressId,
    });
  };

  const setDefaultAddress = (id) => updateProfile({ defaultAddressId: id });

  const addCard = (card) => {
    if (!getUserKey()) return;
    const currentProfile = getProfile() || {};
    const digits = normalizePhone(card.number);
    const cardWithId = {
      id: createId(),
      holder: card.holder,
      expiry: card.expiry,
      last4: digits.slice(-4),
      createdAt: new Date().toISOString(),
    };
    updateProfile({ cards: [...(currentProfile.cards || []), cardWithId] });
  };

  const deleteCard = (id) => {
    const currentProfile = getProfile() || {};
    updateProfile({ cards: (currentProfile.cards || []).filter((card) => card.id !== id) });
  };

  const requestEmailCode = async (email, name = '', flow = 'login') => {
    const normalizedEmail = normalizeEmail(email);
    const trimmedName = name.trim();
    const isRegisterFlow = flow === 'register';
    const existingProfile = profiles[normalizedEmail] || null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { ok: false, error: 'Введите корректную почту' };
    }

    if (isRegisterFlow && trimmedName.length < 2) {
      return { ok: false, error: 'Введите имя' };
    }

    if (isRegisterFlow && existingProfile?.name) {
      return { ok: false, error: 'Аккаунт с этой почтой уже есть. Нажмите "Войти".' };
    }

    if (isEmailAuthEnabled) {
      const login = {
        email: normalizedEmail,
        accountKey: normalizedEmail,
        name: isRegisterFlow ? trimmedName : '',
        flow,
        code: null,
        authMode: 'email',
        requestedAt: new Date().toISOString(),
      };

      try {
        await sendAuthEmailCode(normalizedEmail, isRegisterFlow);
        persistPendingLogin(login);
        return { ok: true, email: true };
      } catch (error) {
        if (error.status === 429 || error.authCode === 'over_email_send_rate_limit') {
          persistPendingLogin({ ...login, rateLimited: true });
          return {
            ok: true,
            email: true,
            warning: 'Supabase временно запретил новое письмо. Введите код из последнего письма или подождите и запросите новый код позже.',
          };
        }

        return {
          ok: false,
          error: isRegisterFlow
            ? `Не удалось отправить код на почту. Проверьте Email provider в Supabase. ${error.message || ''}`
            : `Аккаунт с этой почтой не найден или Supabase отклонил вход. Нажмите "Зарегистрироваться", если это новый аккаунт. ${error.message || ''}`,
        };
      }
    }

    const code = createDemoCode();
    const login = {
      email: normalizedEmail,
      accountKey: normalizedEmail,
      name: isRegisterFlow ? trimmedName : '',
      flow,
      code,
      authMode: 'demo',
      requestedAt: new Date().toISOString(),
    };
    persistPendingLogin(login);

    return { ok: true, code };
  };

  const verifyEmailCode = async (code) => {
    if (!pendingLogin) {
      return { ok: false, error: 'Сначала запросите код подтверждения' };
    }

    if (pendingLogin.authMode === 'email') {
      try {
        await verifyAuthEmailCode(pendingLogin.email, String(code).trim());
      } catch (error) {
        return {
          ok: false,
          error: `Неверный email-код или Supabase отклонил проверку. ${error.message || ''}`,
        };
      }
    } else if (String(code).trim() !== pendingLogin.code) {
      return { ok: false, error: 'Неверный код подтверждения' };
    }

    const accountKey = pendingLogin.accountKey;
    const existingProfile = profiles[accountKey] || {};
    const fallbackName = pendingLogin.email.split('@')[0] || 'Гость';
    const role = isAdminAccount({ email: pendingLogin.email, phone: existingProfile.phone }) ? 'admin' : 'client';
    const nextProfile = {
      ...existingProfile,
      name: existingProfile.name || pendingLogin.name || fallbackName,
      email: pendingLogin.email,
      phone: existingProfile.phone || '',
      normalizedPhone: accountKey,
      role,
      addresses: existingProfile.addresses || [],
      cards: existingProfile.cards || [],
      createdAt: existingProfile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextUser = {
      email: pendingLogin.email,
      phone: nextProfile.phone,
      normalizedPhone: accountKey,
      accountKey,
      name: nextProfile.name,
      role,
      loggedAt: new Date().toISOString(),
    };

    persistProfiles({ ...profiles, [accountKey]: nextProfile });
    pushRemote(() => saveProfileToDatabase(nextProfile));
    setUser(nextUser);
    writeStorage(STORAGE_KEYS.authUser, nextUser);
    clearPendingLogin();

    return { ok: true, user: nextUser };
  };

  const completeEmailLinkSignIn = async (accessToken) => {
    if (!accessToken) {
      return { ok: false, error: 'Нет токена входа' };
    }

    try {
      const authUser = await getAuthUser(accessToken);
      const email = normalizeEmail(authUser?.email || '');

      if (!email) {
        return { ok: false, error: 'Supabase не вернул email пользователя' };
      }

      const accountKey = email;
      const existingProfile = profiles[accountKey] || {};
      const fallbackName = email.split('@')[0] || 'Гость';
      const role = isAdminAccount({ email, phone: existingProfile.phone }) ? 'admin' : 'client';
      const nextProfile = {
        ...existingProfile,
        name: existingProfile.name || pendingLogin?.name || fallbackName,
        email,
        phone: existingProfile.phone || '',
        normalizedPhone: accountKey,
        role,
        addresses: existingProfile.addresses || [],
        cards: existingProfile.cards || [],
        createdAt: existingProfile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const nextUser = {
        email,
        phone: nextProfile.phone,
        normalizedPhone: accountKey,
        accountKey,
        name: nextProfile.name,
        role,
        loggedAt: new Date().toISOString(),
      };

      persistProfiles({ ...profiles, [accountKey]: nextProfile });
      pushRemote(() => saveProfileToDatabase(nextProfile));
      setUser(nextUser);
      writeStorage(STORAGE_KEYS.authUser, nextUser);
      clearPendingLogin();

      return { ok: true, user: nextUser };
    } catch (error) {
      return {
        ok: false,
        error: error.message || 'Не удалось войти по ссылке из письма',
      };
    }
  };

  const logout = () => {
    setUser(null);
    clearPendingLogin();
    persistCart([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.authUser);
    } catch {
      // Ignore storage errors; in-memory logout still applies.
    }
  };

  const addToCart = (dish) => {
    if (!user) {
      return false;
    }

    const current = cart.find((item) => item.id === dish.id);
    const nextCart = current
      ? cart.map((item) => (item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item))
      : [...cart, { ...dish, quantity: 1 }];
    persistCart(nextCart);
    return true;
  };

  const updateQuantity = (id, quantity) => {
    const nextQuantity = Math.max(1, quantity);
    persistCart(cart.map((item) => (item.id === id ? { ...item, quantity: nextQuantity } : item)));
  };

  const removeFromCart = (id) => {
    persistCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => persistCart([]);

  const submitOrder = (order) => {
    const accountKey = getUserKey() || normalizeAccountKey(order.customer?.email || order.customer?.phone || '');
    const spentBonuses = Math.max(0, Number(order.checkout?.bonusPoints || 0));
    const earnBase = Math.max(0, Number(order.total || 0));
    const earnedBonuses = Math.floor(earnBase * 0.05);
    const currentBalance = getBonusBalance(accountKey);
    const nextBalance = Math.max(0, currentBalance - spentBonuses) + earnedBonuses;
    const createdAt = new Date().toISOString();
    const currentProfile = getProfile(accountKey) || {};
    const orderId = createId();
    const payment = createPaymentSnapshot({
      id: createId(),
      orderId,
      method: order.checkout?.paymentMethod || 'cash',
      amount: order.total,
      settings: data.payment,
      createdAt,
    });
    const orderWithBonus = {
      ...order,
      phone: accountKey,
      customer: {
        ...order.customer,
        name: order.customer?.name || user?.name || currentProfile.name || '',
        email: order.customer?.email || user?.email || currentProfile.email || accountKey,
        phone: order.customer?.phone || user?.phone || currentProfile.phone || '',
      },
      status: 'processed',
      statusHistory: [
        {
          status: 'processed',
          label: 'Заказ обработан',
          createdAt,
        },
      ],
      bonus: {
        spent: spentBonuses,
        earned: earnedBonuses,
        balanceAfter: nextBalance,
      },
      payment,
      id: orderId,
      createdAt,
    };
    const newTransactions = [];

    if (spentBonuses > 0) {
      newTransactions.push({
        id: createId(),
        phone: accountKey,
        type: 'spent',
        amount: -spentBonuses,
        description: 'Списание за заказ',
        createdAt,
      });
    }

    if (earnedBonuses > 0) {
      newTransactions.push({
        id: createId(),
        phone: accountKey,
        type: 'earned',
        amount: earnedBonuses,
        description: 'Начисление за заказ',
        createdAt,
      });
    }

    persistOrders([orderWithBonus, ...orders]);
    persistBonusAccounts({ ...bonusAccounts, [accountKey]: nextBalance });
    persistBonusTransactions([...newTransactions, ...bonusTransactions]);
    pushRemote(() => saveOrderToDatabase(orderWithBonus, newTransactions, nextBalance));
    clearCart();
    return orderWithBonus;
  };

  const updateOrderStatus = (orderId, status) => {
    const statusInfo = ORDER_STATUSES.find((item) => item.value === status);
    const statusEvent = {
      status,
      label: statusInfo?.label || status,
      createdAt: new Date().toISOString(),
    };
    const nextOrders = orders.map((order) => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        status,
        deliveredAt: status === 'delivered' ? statusEvent.createdAt : order.deliveredAt,
        statusHistory: [statusEvent, ...(order.statusHistory || [])],
      };
    });

    persistOrders(nextOrders);
    pushRemote(() => updateOrderStatusInDatabase(orderId, status, statusEvent));
  };

  const updatePaymentStatus = (orderId, status) => {
    const statusInfo = getPaymentStatus(status);
    const changedAt = new Date().toISOString();
    const nextOrders = orders.map((order) => {
      if (order.id !== orderId) return order;

      const currentPayment = order.payment || {};
      const nextPayment = {
        ...currentPayment,
        orderId,
        status,
        statusLabel: statusInfo.label,
        updatedAt: changedAt,
        paidAt: status === 'paid' ? currentPayment.paidAt || changedAt : currentPayment.paidAt || null,
        refundedAt: status === 'refunded' || status === 'partially_refunded' ? changedAt : currentPayment.refundedAt || null,
        canceledAt: status === 'canceled' ? changedAt : currentPayment.canceledAt || null,
        events: [
          {
            id: createId(),
            type: 'manual_payment_status',
            status,
            label: statusInfo.label,
            createdAt: changedAt,
          },
          ...(currentPayment.events || []),
        ],
      };

      return {
        ...order,
        payment: nextPayment,
        checkout: {
          ...(order.checkout || {}),
          paymentStatus: status,
        },
      };
    });
    const updatedOrder = nextOrders.find((order) => order.id === orderId);

    persistOrders(nextOrders);
    if (updatedOrder?.payment) {
      pushRemote(() => updatePaymentStatusInDatabase(orderId, updatedOrder.payment));
    }
  };

  const submitBooking = (booking) => {
    const accountKey = getUserKey() || normalizeAccountKey(booking.email || booking.phone || '');
    const currentProfile = getProfile(accountKey) || {};
    const bookingWithMeta = {
      ...booking,
      name: booking.name || user?.name || '',
      email: booking.email || user?.email || currentProfile.email || accountKey,
      phone: booking.phone || user?.phone || currentProfile.phone || '',
      normalizedPhone: accountKey,
      id: createId(),
      createdAt: new Date().toISOString(),
    };
    persistBookings([bookingWithMeta, ...bookings]);
    pushRemote(() => saveBookingToDatabase(bookingWithMeta));
  };

  const updateRestaurant = (updates) => {
    return persistData({ ...data, restaurant: { ...data.restaurant, ...updates } });
  };

  const updatePaymentSettings = (updates) => {
    return persistData({ ...data, payment: normalizePaymentSettings({ ...data.payment, ...updates }) });
  };

  const addDish = (dish) => {
    const newDish = { ...dish, id: createId(), price: Number(dish.price) || 0, popular: false };
    return persistData({
      ...data,
      menuItems: [newDish, ...data.menuItems],
    }).then(() => pushRemote(() => saveMenuItem(newDish), { throwOnError: true }));
  };

  const deleteDish = (id) => {
    const sync = persistData({ ...data, menuItems: data.menuItems.filter((dish) => dish.id !== id) });
    persistCart(cart.filter((item) => item.id !== id));
    return sync.then(() => pushRemote(() => deleteMenuItemFromDatabase(id), { throwOnError: true }));
  };

  const updateDishPrice = (id, price) => {
    const value = Number(price) || 0;
    const nextMenuItems = data.menuItems.map((dish) => (dish.id === id ? { ...dish, price: value } : dish));
    const sync = persistData({
      ...data,
      menuItems: nextMenuItems,
    });
    persistCart(cart.map((item) => (item.id === id ? { ...item, price: value } : item)));
    const updatedDish = nextMenuItems.find((dish) => dish.id === id);
    if (updatedDish) {
      return sync.then(() => pushRemote(() => saveMenuItem(updatedDish), { throwOnError: true }));
    }
    return sync;
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isAuthenticated = Boolean(user);
  const accountKey = getUserKey();
  const isAdmin = Boolean(user && isAdminAccount(user));
  const bonusBalance = getBonusBalance();
  const profile = getProfile();
  const birthdayGreeting = createBirthdayGreeting(profile, user);
  const contactPhone = profile?.phone || user?.phone || '';
  const hasContactPhone = normalizePhone(contactPhone).length >= 7;
  const userOrders = accountKey ? orders.filter((order) => order.phone === accountKey) : [];
  const userBonusTransactions = accountKey
    ? bonusTransactions.filter((transaction) => transaction.phone === accountKey)
    : [];
  const loyaltySpend = userOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const currentRank = [...LOYALTY_RANKS].reverse().find((rank) => loyaltySpend >= rank.threshold) || LOYALTY_RANKS[0];
  const nextRank = LOYALTY_RANKS.find((rank) => rank.threshold > loyaltySpend) || null;
  const notifications = user
    ? [
        ...(birthdayGreeting ? [birthdayGreeting] : []),
        {
          id: 'promo-welcome',
          title: 'Новинки и промокоды',
          text: 'Следите за скидками, сезонными блюдами и персональными предложениями.',
          createdAt: new Date().toISOString(),
          type: 'promo',
        },
        ...userOrders.flatMap((order) =>
          (order.statusHistory || []).map((event) => ({
            id: `${order.id}-${event.status}-${event.createdAt}`,
            title: event.label,
            text: `Заказ #${order.id.slice(0, 6)}: ${event.label.toLowerCase()}.`,
            createdAt: event.createdAt,
            type: 'order',
          })),
        ),
      ]
    : [];

  const value = useMemo(
    () => ({
      data,
      cart,
      cartTotal,
      cartCount,
      user,
      accountKey,
      profile,
      profiles,
      orders,
      bookings,
      userOrders,
      notifications,
      birthdayGreeting,
      loyaltySpend,
      currentRank,
      nextRank,
      userBonusTransactions,
      pendingLogin,
      isAuthenticated,
      isAdmin,
      hasContactPhone,
      contactPhone,
      bonusBalance,
      databaseStatus,
      authStatus,
      reloadDatabase,
      requestEmailCode,
      verifyEmailCode,
      completeEmailLinkSignIn,
      clearPendingLogin,
      logout,
      updateProfile,
      addAddress,
      deleteAddress,
      setDefaultAddress,
      addCard,
      deleteCard,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      submitOrder,
      updateOrderStatus,
      updatePaymentStatus,
      submitBooking,
      updateRestaurant,
      updatePaymentSettings,
      addDish,
      deleteDish,
      updateDishPrice,
    }),
    [
      data,
      cart,
      cartTotal,
      cartCount,
      user,
      accountKey,
      profiles,
      orders,
      bookings,
      pendingLogin,
      isAuthenticated,
      isAdmin,
      hasContactPhone,
      contactPhone,
      bonusBalance,
      databaseStatus,
      bonusAccounts,
      bonusTransactions,
    ],
  );

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used inside RestaurantProvider');
  }
  return context;
};
