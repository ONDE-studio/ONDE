# Пошаговая Инструкция по Развертыванию (Production Deployment)

## 1. Настройка Supabase
1. Создайте проект в [Supabase](https://supabase.com).
2. Перейдите в раздел **SQL Editor** и последовательно выполните SQL-миграции:
   - `supabase/migrations/00_init.sql`
   - `supabase/migrations/01_production_redesign.sql`
3. Скопируйте `URL`, `anon key` и `service_role key` из настроек API.

## 2. Развертывание на Vercel
1. Импортируйте репозиторий в [Vercel](https://vercel.com).
2. Укажите Переменные Окружения (Environment Variables):
   - `NEXT_PUBLIC_SITE_URL`: ваш финальный домен (например, `https://onde-studio.ru`).
   - `NEXT_PUBLIC_SUPABASE_URL`: URL проекта Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Анонимный ключ.
   - `SUPABASE_SERVICE_ROLE_KEY`: Секретный Service Role ключ.
   - `NEXT_PUBLIC_TELEGRAM_USERNAME`: `onde_studio`
   - `TELEGRAM_BOT_TOKEN`: токен вашего Telegram-бота.
   - `TELEGRAM_ADMIN_CHAT_ID`: ID чата владельца/администраторов.
3. Нажмите **Deploy**.

## 3. Настройка первого администратора
Выполните SQL запрос в Supabase для назначения роли `admin`:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@onde.studio';
```
