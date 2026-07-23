# Безопасность и RLS (Row Level Security)

## Ключевые меры безопасности

1. **Row Level Security (RLS)**: Включена для всех таблиц в миграции `01_production_redesign.sql`.
   - `products`: Публичный чтение только активных товаров. Создание и редактирование только для пользователей с ролью `admin`.
   - `orders`: Публичный чтение запрещено. Пользователь может просматривать только свои заказы (`user_id = auth.uid()`). Гости могут смотреть заказ по уникальному подписанному токену `access_token`.
   - `profiles`: Связана с `auth.users(id)`. Пароли не хранятся в открытом виде.

2. **Защита Административной Панели**:
   - Роль администратора определяется исключительно на сервере через функцию `is_admin()`, читающую `app_metadata` или профиль.
   - Защита маршрутов `/admin` реализована через Next.js `middleware.ts`.

3. **Разделение Клиентов Supabase**:
   - `lib/supabase/client.ts`: Браузерный клиент только с анонимным ключом.
   - `lib/supabase/server.ts`: Серверный SSR-клиент.
   - `lib/supabase/admin.ts`: Серверный клиент с `SERVICE_ROLE_KEY` (`server-only`). Никогда не импортируется в Client Components.

4. **HTTP Security Headers**:
   - В `middleware.ts` установлены `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
