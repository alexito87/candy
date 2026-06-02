# CANDY — School Meal Administration System

Учебный fullstack-проект для управления школьным меню, выбора блюд родителями, корзины и последующего оформления заказа.

## Что заложено в стартовом проекте

- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL.
- Frontend: React, TypeScript, Vite, React Router, Axios.
- База данных: базовая модель под первые job-stories.
- Docker Compose для PostgreSQL.
- Начальные тестовые данные через seed.
- API-контуры для меню, выбора блюд, корзины и заказа.

## Быстрый запуск

### 1. Установить зависимости

```bash
npm run install:all
```

### 2. Запустить PostgreSQL

```bash
npm run db:up
```

### 3. Создать `.env` для backend

```bash
cd backend
copy .env.example .env
```

Для PowerShell можно использовать:

```powershell
Copy-Item .env.example .env
```

### 4. Применить миграции и seed

```bash
npm run prisma:migrate
npm run prisma:seed
```

### 5. Создать `.env` для frontend

```bash
cd ../frontend
copy .env.example .env
```

### 6. Запустить проект

Из корня проекта:

```bash
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:4000/api

## Тестовые пользователи

После seed доступны пользователи:

- admin@candy.test — администратор школы
- parent@candy.test — родитель

На текущем этапе авторизация упрощена: frontend передаёт `x-user-id` в API. Полноценный JWT будет добавлен отдельным шагом.

## Основные предметные контуры

1. JS-1. Управление меню администратором.
2. JS-2. Выбор блюд родителем.
3. JS-3. Корзина и подтверждение заказа.
4. JS-4. Оплата заказа.
5. JS-5. Уведомления о дедлайне.

## Следующие шаги разработки

1. Довести UI администратора меню.
2. Добавить полноценную регистрацию/вход/JWT.
3. Разделить роли и permissions.
4. Реализовать оплату.
5. Добавить уведомления за 24 часа до дедлайна.
