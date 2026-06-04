# IdeaBoard

Учебный фронтенд-проект на `React + TypeScript + Vite + Tailwind CSS`.

Приложение показывает ленту идей и проектов с фильтрацией по категориям, поиском по названию, поиском по тегам и окном входа/регистрации.

## Технологии

- `React 19`
- `TypeScript`
- `Vite`
- `Tailwind CSS 4`
- `ESLint`

## Запуск проекта

Установить зависимости:

```bash
npm install
```

Запустить проект в режиме разработки:

```bash
npm run dev
```

Собрать production-версию:

```bash
npm run build
```

Проверить код линтером:

```bash
npm run lint
```

## Env

Файл `.env` лежит в корне `frontend-app`.

```env
VITE_API_URL=http://localhost:3000/api
```

Переменные, которые нужны в React-коде, должны начинаться с `VITE_`.
Если `VITE_API_URL` пустой, приложение использует локальные mock-данные для идей, входа и регистрации.
После изменения `.env` нужно перезапустить `npm run dev`.

## Структура папок

```text
src/
  app/                 # корень приложения, сборка страницы и глобальные состояния
  assets/              # статичные ассеты проекта
  entities/
    idea/
      api/             # запросы к API, связанные с идеями
      model/           # типы, константы, фильтрация и другая доменная логика
      ui/              # UI одной сущности, например карточка идеи
      index.ts         # публичный экспорт сущности
    user/
      api/             # запросы авторизации и регистрации
      model/           # типы пользователя, credentials и auth response
      index.ts         # публичный экспорт сущности
  features/
    auth/              # окно входа и регистрации
    idea-filter/       # самостоятельная фича фильтрации идей
  shared/
    api/               # базовый API-клиент и общая работа с HTTP
    styles/            # глобальные стили и Tailwind
    ui/                # общие UI-элементы и иконки
  widgets/
    app-header/        # крупный блок шапки приложения
    idea-feed/         # крупный блок ленты идей
```

## Где писать логику

Бизнес-логику, которая относится к идеям, пиши в `src/entities/idea/model/`.
Например, фильтрация уже лежит в `src/entities/idea/model/filterIdeas.ts`, типы — в `src/entities/idea/model/types.ts`.

Типы пользователя лежат в `src/entities/user/model/types.ts`.
Там описаны `User`, `LoginCredentials`, `RegisterCredentials`, `AuthTokens` и `AuthResponse`.

Логику конкретного действия пользователя пиши в `src/features/`.
Например, окно входа и регистрации находится в `src/features/auth/`, а фильтр идей — в `src/features/idea-filter/`.

Большие блоки страницы, которые собирают несколько сущностей или фич, держи в `src/widgets/`.
Например, лента проектов находится в `src/widgets/idea-feed/`.

## Где подключаться к API

Базовый `fetch`-клиент лежит в `src/shared/api/httpClient.ts`.
Туда добавляются общие настройки: базовый URL, заголовки, обработка ошибок, авторизация.

Запросы конкретной сущности лежат рядом с ней.
Для идей это `src/entities/idea/api/ideasApi.ts`, для авторизации — `src/entities/user/api/authApi.ts`.

Сейчас `ideasApi.getIdeas()`, `authApi.login()` и `authApi.register()` используют локальные данные, если не задан `VITE_API_URL`.
Когда появится backend, укажи базовый URL в `.env`:

```env
VITE_API_URL=https://example.com/api
```

После этого запросы начнут ходить на endpoints `/ideas`, `/auth/login` и `/auth/register`.

## Команды проекта

- `npm run dev` — запуск dev-сервера
- `npm run build` — production-сборка
- `npm run lint` — проверка ESLint
- `npm run preview` — просмотр production-сборки
