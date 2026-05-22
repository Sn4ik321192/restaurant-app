import React, { createContext, useContext, useMemo, useState } from 'react';
import { restaurantData } from '../data.js';

const STORAGE_KEYS = {
  restaurant: 'restaurant-app-data',
  cart: 'restaurant-app-cart',
  orders: 'restaurant-app-orders',
  bookings: 'restaurant-app-bookings',
  authUser: 'restaurant-app-auth-user',
  bonusAccounts: 'restaurant-app-bonus-accounts',
};

const RestaurantContext = createContext(null);

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const normalizePhone = (phone) => phone.replace(/\D/g, '');

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
  const [bonusAccounts, setBonusAccounts] = useState(() => readStorage(STORAGE_KEYS.bonusAccounts, {}));
  const [pendingLogin, setPendingLogin] = useState(null);

  const persistData = (nextData) => {
    setData(nextData);
    writeStorage(STORAGE_KEYS.restaurant, nextData);
  };

  const persistCart = (nextCart) => {
    setCart(nextCart);
    writeStorage(STORAGE_KEYS.cart, nextCart);
  };

  const persistBonusAccounts = (nextAccounts) => {
    setBonusAccounts(nextAccounts);
    writeStorage(STORAGE_KEYS.bonusAccounts, nextAccounts);
  };

  const getBonusBalance = (phone = user?.normalizedPhone) => {
    if (!phone) return 0;
    return Number(bonusAccounts[normalizePhone(phone)] || 0);
  };

  const isAdminPhone = (phone) => {
    const normalized = normalizePhone(phone);
    return (data.admin.phoneNumbers || []).map(normalizePhone).includes(normalized);
  };

  const requestPhoneCode = (phone) => {
    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length < 7) {
      return { ok: false, error: 'Введите корректный номер телефона' };
    }

    const code = createDemoCode();
    const login = { phone, normalizedPhone, code };
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

    const nextUser = {
      phone: pendingLogin.phone,
      normalizedPhone: pendingLogin.normalizedPhone,
      role: isAdminPhone(pendingLogin.normalizedPhone) ? 'admin' : 'client',
      loggedAt: new Date().toISOString(),
    };

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
    const orders = readStorage(STORAGE_KEYS.orders, []);
    const normalizedPhone = user?.normalizedPhone || normalizePhone(order.customer?.phone || '');
    const spentBonuses = Math.max(0, Number(order.checkout?.bonusPoints || 0));
    const earnBase = Math.max(0, Number(order.total || 0));
    const earnedBonuses = Math.floor(earnBase * 0.05);
    const currentBalance = getBonusBalance(normalizedPhone);
    const nextBalance = Math.max(0, currentBalance - spentBonuses) + earnedBonuses;
    const orderWithBonus = {
      ...order,
      bonus: {
        spent: spentBonuses,
        earned: earnedBonuses,
        balanceAfter: nextBalance,
      },
      id: createId(),
      createdAt: new Date().toISOString(),
    };

    writeStorage(STORAGE_KEYS.orders, [orderWithBonus, ...orders]);
    persistBonusAccounts({ ...bonusAccounts, [normalizedPhone]: nextBalance });
    clearCart();
  };

  const submitBooking = (booking) => {
    const bookings = readStorage(STORAGE_KEYS.bookings, []);
    writeStorage(STORAGE_KEYS.bookings, [
      { ...booking, id: createId(), createdAt: new Date().toISOString() },
      ...bookings,
    ]);
  };

  const updateRestaurant = (updates) => {
    persistData({ ...data, restaurant: { ...data.restaurant, ...updates } });
  };

  const addDish = (dish) => {
    persistData({
      ...data,
      menuItems: [{ ...dish, id: createId(), price: Number(dish.price) || 0, popular: false }, ...data.menuItems],
    });
  };

  const deleteDish = (id) => {
    persistData({ ...data, menuItems: data.menuItems.filter((dish) => dish.id !== id) });
    persistCart(cart.filter((item) => item.id !== id));
  };

  const updateDishPrice = (id, price) => {
    const value = Number(price) || 0;
    persistData({
      ...data,
      menuItems: data.menuItems.map((dish) => (dish.id === id ? { ...dish, price: value } : dish)),
    });
    persistCart(cart.map((item) => (item.id === id ? { ...item, price: value } : item)));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user && isAdminPhone(user.normalizedPhone));
  const bonusBalance = getBonusBalance();

  const value = useMemo(
    () => ({
      data,
      cart,
      cartTotal,
      cartCount,
      user,
      pendingLogin,
      isAuthenticated,
      isAdmin,
      bonusBalance,
      requestPhoneCode,
      verifyPhoneCode,
      logout,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      submitOrder,
      submitBooking,
      updateRestaurant,
      addDish,
      deleteDish,
      updateDishPrice,
    }),
    [data, cart, cartTotal, cartCount, user, pendingLogin, isAuthenticated, isAdmin, bonusBalance, bonusAccounts],
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
