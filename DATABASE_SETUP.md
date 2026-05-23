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
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_ADMIN_EMAILS=owner@example.com
VITE_ADMIN_PHONES=+37361058107
```

Запустите проект:

```bash
npm install
npm run dev
```

Если переменные не указаны, сайт автоматически вернется в демо-режим `localStorage`.

## 4. Настроить вход по email-коду

По умолчанию можно оставить демо-вход:

```env
VITE_AUTH_PROVIDER=demo
```

Чтобы код реально приходил на почту:

1. В Supabase откройте `Authentication`.
2. Перейдите в `Sign In / Providers`.
3. Включите `Email`.
4. В `Authentication` → `URL Configuration` укажите Site URL опубликованного сайта.
5. В `Authentication` → `Email Templates` вставьте HTML из `database/email-template.html` в шаблоны `Confirm signup` и `Magic Link`.
6. Убедитесь, что в шаблоне есть `{{ .Token }}`, а ссылки с `{{ .ConfirmationURL }}` удалены, если нужен только код.
7. После этого поменяйте переменную:

```env
VITE_AUTH_PROVIDER=supabase
```

После входа клиент добавляет телефон в профиле. Без телефона заказ и бронь не откроются, потому что администратор должен иметь контакт для уточнения.

## 5. Как данные попадают в БД

- Первый запуск с Supabase автоматически закидывает стартовые настройки ресторана и меню из `src/data.js`, если таблицы пустые.
- Клиент входит по email и имени, профиль сохраняется в `profiles`.
- Контактный телефон клиента сохраняется в `profiles.phone`.
- Адреса сохраняются в `user_addresses`.
- Маски банковских карт сохраняются в `user_cards`.
- Заказ сохраняется в `orders`, состав заказа в `order_items`.
- Подробности заказа сохраняются в `orders.customer` и `orders.checkout`.
- Статусы заказа сохраняются в `order_status_events`.
- Бонусный баланс сохраняется в `bonus_accounts`.
- История баллов сохраняется в `bonus_transactions`.
- Бронь столика сохраняется в `bookings`.
- Админ меняет статус заказа на `/admin/orders`, клиент видит уведомление в профиле.

## 6. Автоудаление старых доставленных заказов

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

## 7. Подключить БД на GitHub Pages

В GitHub откройте репозиторий:

`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Добавьте:

- `VITE_DB_PROVIDER` = `supabase`
- `VITE_AUTH_PROVIDER` = `supabase`
- `VITE_SUPABASE_URL` = ваш `Project URL`
- `VITE_SUPABASE_ANON_KEY` = ваш `anon public key`
- `VITE_ADMIN_EMAILS` = email владельца или менеджера
- `VITE_ADMIN_PHONES` = телефоны админов через запятую

После следующего `git push` сайт соберется уже с подключением к Supabase и email-входом.

## Важно про безопасность

Файл `database/schema.sql` содержит открытые demo-политики RLS, чтобы статический сайт сразу работал без backend-сервера. Для настоящего ресторана лучше закрыть права и вынести админские операции в backend/API, либо настроить строгие политики Supabase Auth.
