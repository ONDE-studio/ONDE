-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
  id text primary key,
  name text not null,
  description text,
  price numeric not null,
  "originalPrice" numeric,
  "isOnSale" boolean default false,
  "discountPercent" integer,
  image text,
  category text,
  position integer not null default 0,
  featured boolean default false,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
  id text primary key,
  items jsonb not null,
  total numeric not null,
  "customerName" text not null,
  contact text not null,
  comment text,
  method text not null,
  status text not null,
  "userEmail" text,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Таблица пользователей (кастомная, для совместимости с MVP)
CREATE TABLE IF NOT EXISTS users (
  email text primary key,
  name text not null,
  password text not null,
  role text not null,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Настройки витрины
CREATE TABLE IF NOT EXISTS showcase_settings (
  id text primary key,
  settings jsonb not null
);

-- Отключение RLS для MVP (Внимание: на проде лучше настроить RLS!)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE showcase_settings DISABLE ROW LEVEL SECURITY;
