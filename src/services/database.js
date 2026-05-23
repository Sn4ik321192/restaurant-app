const provider = import.meta.env.VITE_DB_PROVIDER || 'local';
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isRemoteDatabaseEnabled = provider === 'supabase' && Boolean(supabaseUrl && supabaseKey);
export const databaseMode = isRemoteDatabaseEnabled ? 'supabase' : 'localStorage';

const now = () => new Date().toISOString();

const compact = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

const eq = (value) => `eq.${encodeURIComponent(value)}`;

async function request(table, { method = 'GET', query = 'select=*', body, prefer = 'return=representation' } = {}) {
  if (!isRemoteDatabaseEnabled) {
    return null;
  }

  const separator = query ? `?${query}` : '';
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${separator}`, {
    method,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Database error: ${response.status} ${message}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const menuToRow = (item) =>
  compact({
    id: String(item.id),
    name: item.name,
    category: item.category,
    description: item.description,
    price: Number(item.price || 0),
    popular: Boolean(item.popular),
    image: item.image || null,
    updated_at: now(),
  });

const rowToMenu = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  description: row.description || '',
  price: Number(row.price || 0),
  popular: Boolean(row.popular),
  image: row.image || '',
});

const profileToRow = (profile) =>
  compact({
    normalized_phone: profile.normalizedPhone,
    phone: profile.phone || '',
    name: profile.name || '',
    birth_date: profile.birthDate || null,
    gender: profile.gender || null,
    role: profile.role || null,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt || now(),
  });

const rowToProfile = (row) => ({
  phone: row.phone,
  normalizedPhone: row.normalized_phone,
  email: String(row.normalized_phone || '').includes('@') ? row.normalized_phone : '',
  name: row.name || '',
  birthDate: row.birth_date || '',
  gender: row.gender || 'Не важно',
  role: row.role || 'client',
  addresses: [],
  cards: [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const addressToRow = (address, normalizedPhone) => ({
  id: address.id,
  normalized_phone: normalizedPhone,
  city: address.city || '',
  street: address.street || '',
  house: address.house || '',
  entrance: address.entrance || '',
  floor: address.floor || '',
  apartment: address.apartment || '',
  use_default: Boolean(address.useDefault),
  created_at: address.createdAt || now(),
});

const rowToAddress = (row) => ({
  id: row.id,
  city: row.city || '',
  street: row.street || '',
  house: row.house || '',
  entrance: row.entrance || '',
  floor: row.floor || '',
  apartment: row.apartment || '',
  useDefault: Boolean(row.use_default),
  createdAt: row.created_at,
});

const cardToRow = (card, normalizedPhone) => ({
  id: card.id,
  normalized_phone: normalizedPhone,
  holder: card.holder || '',
  expiry: card.expiry || '',
  last4: card.last4 || '',
  created_at: card.createdAt || now(),
});

const rowToCard = (row) => ({
  id: row.id,
  holder: row.holder || '',
  expiry: row.expiry || '',
  last4: row.last4 || '',
  createdAt: row.created_at,
});

const orderToRow = (order) => ({
  id: order.id,
  phone: order.phone || '',
  status: order.status || 'processed',
  total: Number(order.total || 0),
  customer: order.customer || {},
  checkout: order.checkout || {},
  bonus: order.bonus || {},
  created_at: order.createdAt || now(),
  updated_at: now(),
  delivered_at: order.deliveredAt || null,
});

const rowToOrder = (row, items, events) => ({
  id: row.id,
  phone: row.phone || '',
  status: row.status || 'processed',
  total: Number(row.total || 0),
  customer: row.customer || {},
  checkout: row.checkout || {},
  bonus: row.bonus || {},
  items,
  statusHistory: events,
  createdAt: row.created_at,
  deliveredAt: row.delivered_at,
});

const orderItemToRow = (item, orderId) => ({
  id: `${orderId}-${item.id}`,
  order_id: orderId,
  dish_id: String(item.id),
  name: item.name,
  category: item.category || '',
  description: item.description || '',
  price: Number(item.price || 0),
  quantity: Number(item.quantity || 1),
  image: item.image || '',
});

const rowToOrderItem = (row) => ({
  id: row.dish_id,
  name: row.name,
  category: row.category || '',
  description: row.description || '',
  price: Number(row.price || 0),
  quantity: Number(row.quantity || 1),
  image: row.image || '',
});

const statusEventToRow = (event, orderId) => ({
  id: `${orderId}-${event.status}-${Date.parse(event.createdAt) || Date.now()}`,
  order_id: orderId,
  status: event.status,
  label: event.label,
  created_at: event.createdAt || now(),
});

const rowToStatusEvent = (row) => ({
  status: row.status,
  label: row.label,
  createdAt: row.created_at,
});

const bookingToRow = (booking) => ({
  id: booking.id,
  normalized_phone: booking.normalizedPhone || '',
  name: booking.name || '',
  phone: booking.phone || '',
  date: booking.date || null,
  time: booking.time || null,
  guests: Number(booking.guests || 1),
  comment: booking.comment || '',
  created_at: booking.createdAt || now(),
});

const rowToBooking = (row) => ({
  id: row.id,
  normalizedPhone: row.normalized_phone || '',
  name: row.name || '',
  phone: row.phone || '',
  date: row.date || '',
  time: row.time || '',
  guests: String(row.guests || 1),
  comment: row.comment || '',
  createdAt: row.created_at,
});

export async function ensureDatabaseSeed(defaultData) {
  if (!isRemoteDatabaseEnabled) return;

  const settings = await request('restaurant_settings', { query: 'id=eq.main&select=id' });
  if (!settings?.length) {
    await saveRestaurantSettings(defaultData);
  }

  const menu = await request('menu_items', { query: 'select=id&limit=1' });
  if (!menu?.length && defaultData.menuItems?.length) {
    await request('menu_items', {
      method: 'POST',
      body: defaultData.menuItems.map(menuToRow),
      prefer: 'return=minimal',
    });
  }
}

export async function fetchDatabaseState() {
  if (!isRemoteDatabaseEnabled) return null;

  const [
    settingsRows,
    menuRows,
    profileRows,
    addressRows,
    cardRows,
    orderRows,
    orderItemRows,
    statusRows,
    bonusAccountRows,
    bonusTransactionRows,
    bookingRows,
  ] = await Promise.all([
    request('restaurant_settings', { query: 'id=eq.main&select=*' }),
    request('menu_items', { query: 'select=*&order=created_at.asc' }),
    request('profiles', { query: 'select=*&order=created_at.desc' }),
    request('user_addresses', { query: 'select=*&order=created_at.asc' }),
    request('user_cards', { query: 'select=*&order=created_at.asc' }),
    request('orders', { query: 'select=*&order=created_at.desc' }),
    request('order_items', { query: 'select=*&order=id.asc' }),
    request('order_status_events', { query: 'select=*&order=created_at.desc' }),
    request('bonus_accounts', { query: 'select=*' }),
    request('bonus_transactions', { query: 'select=*&order=created_at.desc' }),
    request('bookings', { query: 'select=*&order=created_at.desc' }),
  ]);

  const profiles = {};
  (profileRows || []).forEach((row) => {
    profiles[row.normalized_phone] = rowToProfile(row);
  });

  (addressRows || []).forEach((row) => {
    if (!profiles[row.normalized_phone]) return;
    profiles[row.normalized_phone].addresses.push(rowToAddress(row));
    if (row.use_default) {
      profiles[row.normalized_phone].defaultAddressId = row.id;
    }
  });

  (cardRows || []).forEach((row) => {
    if (!profiles[row.normalized_phone]) return;
    profiles[row.normalized_phone].cards.push(rowToCard(row));
  });

  const itemsByOrder = {};
  (orderItemRows || []).forEach((row) => {
    itemsByOrder[row.order_id] = [...(itemsByOrder[row.order_id] || []), rowToOrderItem(row)];
  });

  const eventsByOrder = {};
  (statusRows || []).forEach((row) => {
    eventsByOrder[row.order_id] = [...(eventsByOrder[row.order_id] || []), rowToStatusEvent(row)];
  });

  const settings = settingsRows?.[0];
  const data = settings
    ? {
        admin: settings.admin || undefined,
        restaurant: settings.restaurant || undefined,
        categories: settings.categories || undefined,
        benefits: settings.benefits || undefined,
        testimonials: settings.testimonials || undefined,
        openingHours: settings.opening_hours || undefined,
        menuItems: (menuRows || []).map(rowToMenu),
      }
    : {
        menuItems: (menuRows || []).map(rowToMenu),
      };

  return {
    data,
    profiles,
    orders: (orderRows || []).map((row) => rowToOrder(row, itemsByOrder[row.id] || [], eventsByOrder[row.id] || [])),
    bonusAccounts: Object.fromEntries((bonusAccountRows || []).map((row) => [row.normalized_phone, Number(row.balance || 0)])),
    bonusTransactions: (bonusTransactionRows || []).map((row) => ({
      id: row.id,
      phone: row.normalized_phone,
      type: row.type,
      amount: Number(row.amount || 0),
      description: row.description || '',
      createdAt: row.created_at,
    })),
    bookings: (bookingRows || []).map(rowToBooking),
  };
}

export async function saveRestaurantSettings(data) {
  if (!isRemoteDatabaseEnabled) return;

  await request('restaurant_settings', {
    method: 'POST',
    query: 'on_conflict=id',
    body: {
      id: 'main',
      admin: data.admin,
      restaurant: data.restaurant,
      categories: data.categories,
      benefits: data.benefits,
      testimonials: data.testimonials,
      opening_hours: data.openingHours,
      updated_at: now(),
    },
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}

export async function saveMenuItem(item) {
  if (!isRemoteDatabaseEnabled) return;

  await request('menu_items', {
    method: 'POST',
    query: 'on_conflict=id',
    body: menuToRow(item),
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}

export async function deleteMenuItem(id) {
  if (!isRemoteDatabaseEnabled) return;

  await request('menu_items', {
    method: 'DELETE',
    query: `id=${eq(id)}`,
    prefer: 'return=minimal',
  });
}

export async function saveProfile(profile) {
  if (!isRemoteDatabaseEnabled || !profile?.normalizedPhone) return;

  await request('profiles', {
    method: 'POST',
    query: 'on_conflict=normalized_phone',
    body: profileToRow(profile),
    prefer: 'resolution=merge-duplicates,return=minimal',
  });

  await request('user_addresses', {
    method: 'DELETE',
    query: `normalized_phone=${eq(profile.normalizedPhone)}`,
    prefer: 'return=minimal',
  });
  if (profile.addresses?.length) {
    await request('user_addresses', {
      method: 'POST',
      body: profile.addresses.map((address) => ({
        ...addressToRow(address, profile.normalizedPhone),
        use_default: profile.defaultAddressId === address.id,
      })),
      prefer: 'return=minimal',
    });
  }

  await request('user_cards', {
    method: 'DELETE',
    query: `normalized_phone=${eq(profile.normalizedPhone)}`,
    prefer: 'return=minimal',
  });
  if (profile.cards?.length) {
    await request('user_cards', {
      method: 'POST',
      body: profile.cards.map((card) => cardToRow(card, profile.normalizedPhone)),
      prefer: 'return=minimal',
    });
  }
}

export async function saveOrder(order, bonusTransactions = [], bonusBalance = 0) {
  if (!isRemoteDatabaseEnabled) return;

  await request('orders', {
    method: 'POST',
    body: orderToRow(order),
    prefer: 'return=minimal',
  });

  if (order.items?.length) {
    await request('order_items', {
      method: 'POST',
      body: order.items.map((item) => orderItemToRow(item, order.id)),
      prefer: 'return=minimal',
    });
  }

  if (order.statusHistory?.length) {
    await request('order_status_events', {
      method: 'POST',
      body: order.statusHistory.map((event) => statusEventToRow(event, order.id)),
      prefer: 'return=minimal',
    });
  }

  await request('bonus_accounts', {
    method: 'POST',
    query: 'on_conflict=normalized_phone',
    body: {
      normalized_phone: order.phone,
      balance: Number(bonusBalance || 0),
      updated_at: now(),
    },
    prefer: 'resolution=merge-duplicates,return=minimal',
  });

  if (bonusTransactions.length) {
    await request('bonus_transactions', {
      method: 'POST',
      body: bonusTransactions.map((transaction) => ({
        id: transaction.id,
        normalized_phone: transaction.phone,
        type: transaction.type,
        amount: Number(transaction.amount || 0),
        description: transaction.description || '',
        created_at: transaction.createdAt || now(),
      })),
      prefer: 'return=minimal',
    });
  }
}

export async function updateOrderStatus(orderId, status, event) {
  if (!isRemoteDatabaseEnabled) return;

  await request('orders', {
    method: 'PATCH',
    query: `id=${eq(orderId)}`,
    body: {
      status,
      updated_at: now(),
      delivered_at: status === 'delivered' ? event.createdAt : null,
    },
    prefer: 'return=minimal',
  });

  await request('order_status_events', {
    method: 'POST',
    body: statusEventToRow(event, orderId),
    prefer: 'return=minimal',
  });
}

export async function saveBooking(booking) {
  if (!isRemoteDatabaseEnabled) return;

  await request('bookings', {
    method: 'POST',
    body: bookingToRow(booking),
    prefer: 'return=minimal',
  });
}
