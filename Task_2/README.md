# Автоматизация E2E тестов Task Tracker

## Что проверяем
- Создание задачи
- Открытие карточки задачи
- Поиск задачи
- Переход на доску проекта

## Технологии
- Playwright + @playwright/test
- Node.js 18+

## Подготовка окружения
1. Установите Node.js (v18+).
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Скачайте браузеры Playwright (однократно):
   ```bash
   npx playwright install chromium
   ```

## Запуск тестов
- Все тесты в headless-режиме:
  ```bash
  npm test
  ```
- С UI (headed):
  ```bash
  npm run test:headed
  ```

## Настройки
- Прямой заход на `/issues` отдаёт 404, тесты открывают корень `/` и ждут редирект на `/issues`.
- Репорты по умолчанию — стандартный HTML Playwright (`playwright-report`).
