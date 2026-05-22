# Подключение демо-базы данных

Проект работает в двух режимах:

- `local` — демо-режим без сервера, данные лежат в `localStorage`.
- `supabase` — общая база PostgreSQL через Supabase. Заказы, брони, меню, профили, адреса, карты, бонусы и статусы видны на разных устройствах.

## 1. Создать проект Supabase

1. Зайдите на [supabase.com](https://supabase.com).
2. Создайте новый проект.
3. Откройте `SQL Editor`.
4. Вставьте весь код из файла `database/schema.sql`.
5. Нажмите `Run`.

После этого появятся таблицы:

- `restaurant_settings`
- `menu_items`
- `profiles`
- `user_addresses`
- `user_cards`
- `orders`
- `order_items`
- `order_status_events`
- `bonus_accounts`
- `bonus_transactions`
- `bookings`

## 2. Взять ключи подключения

В Supabase откройте:

`Project Settings` → `API`

Скопируйте:

- `Project URL`
- `anon public key`

## 3. Подключить БД локально

Создайте файл `.env.local` рядом с `package.json`:

```env
VITE_DB_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Запустите проект:

```bash
npm install
npm run dev
```

Если переменные не указаны, сайт автоматически вернется в демо-режим `localStorage`.

## 4. Как данные попадают в БД

- Первый запуск с Supabase автоматически закидывает стартовые настройки ресторана и меню из `src/data.js`, если таблицы пустые.
- Клиент входит по номеру и имени, профиль сохраняется в `profiles`.
- Адреса сохраняются в `user_addresses`.
- Маски банковских карт сохраняются в `user_cards`.
- Заказ сохраняется в `orders`, состав заказа в `order_items`.
- Статусы заказа сохраняются в `order_status_events`.
- Бонусный баланс сохраняется в `bonus_accounts`.
- История баллов сохраняется в `bonus_transactions`.
- Бронь столика сохраняется в `bookings`.
- Админ меняет статус заказа, клиент видит уведомление в профиле.

## 5. Автоудаление готовых заказов

В `database/schema.sql` уже есть функция:

```sql
select cleanup_completed_orders(30);
```

Она удаляет заказы со статусом `delivered`, если они были доставлены больше 30 дней назад. Состав заказа и история статусов удалятся автоматически через `on delete cascade`.

Чтобы чистить заказы автоматически каждый день, в Supabase можно включить `pg_cron` и выполнить:

```sql
create extension if not exists pg_cron;

select cron.schedule(
  'restaurant_cleanup_completed_orders',
  '0 4 * * *',
  $$select cleanup_completed_orders(30);$$
);
```

Число `30` можно заменить на `7`, `14`, `60` и так далее.

## 6. Подключить БД на GitHub Pages

В GitHub откройте репозиторий:

`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Добавьте:

- `VITE_DB_PROVIDER` = `supabase`
- `VITE_SUPABASE_URL` = ваш `Project URL`
- `VITE_SUPABASE_ANON_KEY` = ваш `anon public key`

После следующего `git push` сайт соберется уже с подключением к Supabase.

## Важно про безопасность

Файл `database/schema.sql` содержит открытые demo-политики RLS, чтобы статический сайт сразу работал без backend-сервера. Для настоящего ресторана лучше закрыть права и вынести админские операции в backend/API, либо настроить строгие политики Supabase Auth.
