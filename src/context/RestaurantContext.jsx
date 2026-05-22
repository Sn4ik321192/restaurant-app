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
} from '../services/database.js';

const STORAGE_KEYS = {
  restaurant: 'restaurant-app-data',
  cart: 'restaurant-app-cart',
  orders: 'restaurant-app-orders',
  bookings: 'restaurant-app-bookings',
  authUser: 'restaurant-app-auth-user',
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

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const normalizePhone = (phone = '') => phone.replace(/\D/g, '');

const createDemoCode = () => String(Math.floor(1000 + Math.random() * 9000));

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
  const [pendingLogin, setPendingLogin] = useState(null);
  const [databaseStatus, setDatabaseStatus] = useState({
    mode: databaseMode,
    enabled: isRemoteDatabaseEnabled,
    connected: false,
    loading: isRemoteDatabaseEnabled,
    error: '',
  });

  const pushRemote = (operation) => {
    if (!isRemoteDatabaseEnabled || !operation) return;

    Promise.resolve()
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
    pushRemote(() => saveRestaurantSettings(nextData));
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

  const isAdminPhone = (phone) => {
    const normalized = normalizePhone(phone);
    return (data.admin.phoneNumbers || []).map(normalizePhone).includes(normalized);
  };

  const getBonusBalance = (phone = user?.normalizedPhone) => {
    if (!phone) return 0;
    return Number(bonusAccounts[normalizePhone(phone)] || 0);
  };

  const getProfile = (phone = user?.normalizedPhone) => {
    if (!phone) return null;
    return profiles[normalizePhone(phone)] || null;
  };

  const updateProfile = (updates) => {
    if (!user?.normalizedPhone) return;

    const currentProfile = getProfile() || {};
    const nextProfile = {
      ...currentProfile,
      ...updates,
      phone: user.phone,
      normalizedPhone: user.normalizedPhone,
      updatedAt: new Date().toISOString(),
    };
    const nextProfiles = { ...profiles, [user.normalizedPhone]: nextProfile };
    const nextUser = { ...user, name: nextProfile.name || user.name };

    persistProfiles(nextProfiles);
    setUser(nextUser);
    writeStorage(STORAGE_KEYS.authUser, nextUser);
    pushRemote(() => saveProfileToDatabase(nextProfile));
  };

  const addAddress = (address) => {
    if (!user?.normalizedPhone) return;
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
    if (!user?.normalizedPhone) return;
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

  const requestPhoneCode = (phone, name = '') => {
    const normalizedPhone = normalizePhone(phone);
    const trimmedName = name.trim();

    if (normalizedPhone.length < 7) {
      return { ok: false, error: 'Введите корректный номер телефона' };
    }

    if (trimmedName.length < 2) {
      return { ok: false, error: 'Введите имя' };
    }

    const code = createDemoCode();
    const login = { phone, normalizedPhone, name: trimmedName, code };
    setPendingLogin(login);

    return { ok: true, code };
  };

  const verifyPhoneCode = (code) => {
    if (!pendingLogin) {
      return { ok: false, error: 'Сначала запросите код подтверждения' };
    }

    if (String(code).trim() !== pendingLogin.code) {
      return { ok: false, error: 'Неверный код подтверждения' };
    }

    const existingProfile = profiles[pendingLogin.normalizedPhone] || {};
    const role = isAdminPhone(pendingLogin.normalizedPhone) ? 'admin' : 'client';
    const nextProfile = {
      ...existingProfile,
      name: pendingLogin.name,
      phone: pendingLogin.phone,
      normalizedPhone: pendingLogin.normalizedPhone,
      role,
      addresses: existingProfile.addresses || [],
      cards: existingProfile.cards || [],
      createdAt: existingProfile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextUser = {
      phone: pendingLogin.phone,
      normalizedPhone: pendingLogin.normalizedPhone,
      name: nextProfile.name,
      role,
      loggedAt: new Date().toISOString(),
    };

    persistProfiles({ ...profiles, [pendingLogin.normalizedPhone]: nextProfile });
    pushRemote(() => saveProfileToDatabase(nextProfile));
    setUser(nextUser);
    writeStorage(STORAGE_KEYS.authUser, nextUser);
    setPendingLogin(null);

    return { ok: true, user: nextUser };
  };

  const logout = () => {
    setUser(null);
    setPendingLogin(null);
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
    const normalizedPhone = user?.normalizedPhone || normalizePhone(order.customer?.phone || '');
    const spentBonuses = Math.max(0, Number(order.checkout?.bonusPoints || 0));
    const earnBase = Math.max(0, Number(order.total || 0));
    const earnedBonuses = Math.floor(earnBase * 0.05);
    const currentBalance = getBonusBalance(normalizedPhone);
    const nextBalance = Math.max(0, currentBalance - spentBonuses) + earnedBonuses;
    const createdAt = new Date().toISOString();
    const orderWithBonus = {
      ...order,
      phone: normalizedPhone,
      customer: {
        ...order.customer,
        name: order.customer?.name || user?.name || getProfile(normalizedPhone)?.name || '',
        phone: order.customer?.phone || user?.phone || '',
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
      id: createId(),
      createdAt,
    };
    const newTransactions = [];

    if (spentBonuses > 0) {
      newTransactions.push({
        id: createId(),
        phone: normalizedPhone,
        type: 'spent',
        amount: -spentBonuses,
        description: 'Списание за заказ',
        createdAt,
      });
    }

    if (earnedBonuses > 0) {
      newTransactions.push({
        id: createId(),
        phone: normalizedPhone,
        type: 'earned',
        amount: earnedBonuses,
        description: 'Начисление за заказ',
        createdAt,
      });
    }

    persistOrders([orderWithBonus, ...orders]);
    persistBonusAccounts({ ...bonusAccounts, [normalizedPhone]: nextBalance });
    persistBonusTransactions([...newTransactions, ...bonusTransactions]);
    pushRemote(() => saveOrderToDatabase(orderWithBonus, newTransactions, nextBalance));
    clearCart();
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

  const submitBooking = (booking) => {
    const bookingWithMeta = {
      ...booking,
      name: booking.name || user?.name || '',
      phone: booking.phone || user?.phone || '',
      normalizedPhone: user?.normalizedPhone || normalizePhone(booking.phone || ''),
      id: createId(),
      createdAt: new Date().toISOString(),
    };
    persistBookings([bookingWithMeta, ...bookings]);
    pushRemote(() => saveBookingToDatabase(bookingWithMeta));
  };

  const updateRestaurant = (updates) => {
    persistData({ ...data, restaurant: { ...data.restaurant, ...updates } });
  };

  const addDish = (dish) => {
    const newDish = { ...dish, id: createId(), price: Number(dish.price) || 0, popular: false };
    persistData({
      ...data,
      menuItems: [newDish, ...data.menuItems],
    });
    pushRemote(() => saveMenuItem(newDish));
  };

  const deleteDish = (id) => {
    persistData({ ...data, menuItems: data.menuItems.filter((dish) => dish.id !== id) });
    persistCart(cart.filter((item) => item.id !== id));
    pushRemote(() => deleteMenuItemFromDatabase(id));
  };

  const updateDishPrice = (id, price) => {
    const value = Number(price) || 0;
    const nextMenuItems = data.menuItems.map((dish) => (dish.id === id ? { ...dish, price: value } : dish));
    persistData({
      ...data,
      menuItems: nextMenuItems,
    });
    persistCart(cart.map((item) => (item.id === id ? { ...item, price: value } : item)));
    const updatedDish = nextMenuItems.find((dish) => dish.id === id);
    if (updatedDish) {
      pushRemote(() => saveMenuItem(updatedDish));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user && isAdminPhone(user.normalizedPhone));
  const bonusBalance = getBonusBalance();
  const profile = getProfile();
  const userOrders = user?.normalizedPhone ? orders.filter((order) => order.phone === user.normalizedPhone) : [];
  const userBonusTransactions = user?.normalizedPhone
    ? bonusTransactions.filter((transaction) => transaction.phone === user.normalizedPhone)
    : [];
  const loyaltySpend = userOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const currentRank = [...LOYALTY_RANKS].reverse().find((rank) => loyaltySpend >= rank.threshold) || LOYALTY_RANKS[0];
  const nextRank = LOYALTY_RANKS.find((rank) => rank.threshold > loyaltySpend) || null;
  const notifications = user
    ? [
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
      profile,
      profiles,
      orders,
      bookings,
      userOrders,
      notifications,
      loyaltySpend,
      currentRank,
      nextRank,
      userBonusTransactions,
      pendingLogin,
      isAuthenticated,
      isAdmin,
      bonusBalance,
      databaseStatus,
      reloadDatabase,
      requestPhoneCode,
      verifyPhoneCode,
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
      submitBooking,
      updateRestaurant,
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
      profiles,
      orders,
      bookings,
      pendingLogin,
      isAuthenticated,
      isAdmin,
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
