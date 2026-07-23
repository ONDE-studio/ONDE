# ONDE Studio — Платформа Дизайнерской 3D-Печати

Production-ready интернет-магазин студии дизайнерской 3D-печати **ONDE**. 

Официальный сайт: [onde-studio.ru](https://onde-studio.ru)

---

## 🛠 Технологический Стек

- **Фреймворк**: Next.js 16 (App Router, React 19, Server Components)
- **Стилизация**: Tailwind CSS v4, Lucide Icons, Shadcn UI
- **База Данных & Auth**: Supabase (PostgreSQL, Row Level Security, Auth, SSR Cookies)
- **Валидация**: Zod
- **Доставка & Логистика**: СДЭК API v2, Почта России API, Яндекс Доставка B2B, Telegram Provider
- **Интеграция**: Telegram Bot API

---

## 🚀 Быстрый Запуск

### 1. Требования
- Node.js >= 20.x
- npm >= 10.x
- Аккаунт Supabase

### 2. Установка Зависимостей
```bash
npm install
```

### 3. Переменные Окружения
Создайте файл `.env.local` на основе `.env.example`:
```bash
cp .env.example .env.local
```

Заполните обязательные ключи Supabase:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_TELEGRAM_USERNAME=onde_studio
```

### 4. Применение SQL Миграций
Перейдите в консоль Supabase SQL Editor и выполните файлы из папки `supabase/migrations/`:
1. `00_init.sql`
2. `01_production_redesign.sql`
3. `02_security_and_reliability.sql`
4. `03_admin_bootstrap_security.sql`

### 5. Запуск в режиме разработки
```bash
npm run dev
```
Откройте [http://localhost:3000](http://localhost:3000).

---

## 🧪 Проверка Качества Кода

```bash
# Проверка типов TypeScript
npm run typecheck

# Линтинг ESLint
npm run lint

# Тестирование Vitest
npm test

# Сборка production бандла
npm run build
```

---

## 📚 Документация Проекта

- [Назначение Администратора (`docs/ADMIN_SETUP.md`)](docs/ADMIN_SETUP.md)
- [Расчет Доставки (`docs/SHIPPING.md`)](docs/SHIPPING.md)
- [Тестирование RLS (`docs/rls-testing.md`)](docs/rls-testing.md)
- [Безопасность и RLS (`docs/SECURITY.md`)](docs/SECURITY.md)
- [Инструкция по Развертыванию (`docs/DEPLOYMENT.md`)](docs/DEPLOYMENT.md)
- [Бизнес-процесс Заказов (`docs/ORDER_FLOW.md`)](docs/ORDER_FLOW.md)
