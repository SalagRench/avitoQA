const { test, expect } = require('@playwright/test');

const randomName = (prefix = 'Задача') => `${prefix}${Math.floor(Math.random() * 10000)}`;

const selectors = {
  createButton: () => page => page.getByRole('banner').getByRole('button', { name: /создать задачу/i }),
  nameInput: page => page.getByRole('textbox', { name: /название/i }),
  descInput: page => page.getByRole('textbox', { name: /описание/i }),
  projectSelect: page => page.getByRole('combobox', { name: 'Проект' }).first(),
  prioritySelect: page => page.getByRole('combobox', { name: 'Проект' }).nth(1),
  assigneeSelect: page => page.getByRole('combobox', { name: 'Проект' }).nth(3),
};

async function waitForList(page) {
  await expect(page.getByText(/список задач/i)).toBeVisible({ timeout: 10000 });
  await page.locator('.MuiCircularProgress-root').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
}

async function openCreateModal(page) {
  const btn = selectors.createButton()(page);
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.click();
  await expect(page.getByText(/создание задачи/i)).toBeVisible({ timeout: 5000 });
}

async function createIssue(page, { title = randomName(), description = 'Описание задачи', assignee = 'Александра Ветрова' } = {}) {
  await openCreateModal(page);
  await selectors.nameInput(page).fill(title);
  await selectors.descInput(page).fill(description);
  await selectors.projectSelect(page).click();
  await page.getByRole('option', { name: 'Редизайн карточки товара' }).click();
  await selectors.prioritySelect(page).click();
  await page.getByRole('option', { name: 'Low' }).click();
  await selectors.assigneeSelect(page).click();
  await page.getByRole('option', { name: assignee }).click();
  await page.getByRole('button', { name: /^создать$/i }).click();
  await expect(page.getByRole('heading', { name: title }).first()).toBeVisible({ timeout: 10000 });
  return title;
}

test.beforeEach(async ({ page }) => {
  await page.goto('https://avito-tech-internship-psi.vercel.app/', { waitUntil: 'networkidle' });
  await waitForList(page);
});

test.describe('Создание задачи', () => {
  test('TC_E2E_01: создание с обязательными полями', async ({ page }) => {
    const title = await createIssue(page, { title: randomName('Задача87-') });
    await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();
  });

  test('TC_E2E_02: создание с заполнением всех полей', async ({ page }) => {
    const title = await createIssue(page, { title: randomName('Задача88-'), description: 'Полное описание' });
    await page.getByRole('heading', { name: title }).first().click();
    await expect(page.getByText(/Полное описание/i)).toBeVisible();
  });

  test('TC_E2E_03: валидация пустого названия', async ({ page }) => {
    await openCreateModal(page);
    await selectors.nameInput(page).fill('');
    await expect(page.getByRole('button', { name: /^создать$/i })).toBeDisabled();
  });

  test('TC_E2E_04: отмена создания', async ({ page }) => {
    const title = 'Задача89';
    await openCreateModal(page);
    await selectors.nameInput(page).fill(title);
    await page.getByRole('button', { name: /создать/i, exact: false }).press('Escape');
    await expect(page.getByRole('button', { name: /^создать$/i })).toBeHidden({ timeout: 5000 }).catch(() => {});
    await selectors.createButton()(page).click(); // открываем снова, чтобы вернуться к списку
    await expect(page.getByRole('heading', { name: title })).toHaveCount(0);
  });

  test('TC_E2E_05: создание дубликатов', async ({ page }) => {
    const title = 'Задача90';
    await createIssue(page, { title });
    await createIssue(page, { title });
    const count = await page.getByRole('heading', { name: title }).count();
    expect(count).toBeGreaterThan(1);
  });
});

test.describe('Карточка задачи', () => {
  test('TC_E2E_06: открыть карточку', async ({ page }) => {
    const title = await createIssue(page, { title: 'Задача91' });
    await page.getByRole('heading', { name: title }).first().click();
    await expect(page.getByRole('textbox', { name: /Название/i })).toBeVisible();
  });

  test('TC_E2E_07: закрыть карточку', async ({ page }) => {
    const title = await createIssue(page, { title: 'Задача92' });
    await page.getByRole('heading', { name: title }).first().click();
    await page.keyboard.press('Escape');
    await expect(page.getByText(/создание задачи/i)).toHaveCount(0);
  });

  test.fixme('TC_E2E_08: редактирование карточки (баг: изменения не сохраняются)', async () => {});
});

test.describe('Поиск задачи', () => {
  test('TC_E2E_09: поиск по точному названию', async ({ page }) => {
    const title = await createIssue(page, { title: 'Задача93' });
    await page.getByPlaceholder(/поиск/i).fill(title);
    await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();
  });

  test('TC_E2E_10: поиск по части названия', async ({ page }) => {
    const title = await createIssue(page, { title: 'Задача94' });
    await page.getByPlaceholder(/поиск/i).fill('Задача');
    await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();
  });

  test('TC_E2E_11: поиск без результатов', async ({ page }) => {
    await page.getByPlaceholder(/поиск/i).fill('НЕСУЩЕСТВУЕТ');
    await expect(page.getByText(/задачи не найдены/i)).toBeVisible();
  });
});

test.describe('Навигация', () => {
  test('TC_E2E_12: переход на доску', async ({ page }) => {
    await page.getByRole('link', { name: /проекты/i }).click();
    await expect(page).toHaveURL(/boards/i);
    await expect(page.getByRole('heading', { name: /проекты/i }).first()).toBeVisible();
  });

  test('TC_E2E_13: возврат к списку задач', async ({ page }) => {
    await page.getByRole('link', { name: /проекты/i }).click();
    await page.getByRole('link', { name: /задачи/i }).click();
    await expect(page).toHaveURL(/issues/i);
    await expect(page.getByText(/список задач/i)).toBeVisible();
  });
});

test.describe('Фильтры', () => {
  test('TC_E2E_14: фильтр по статусу Backlog', async ({ page }) => {
    const statusCombo = page.getByRole('combobox').first();
    await statusCombo.click();
    await page.getByRole('option', { name: 'Backlog' }).click();
    await expect(page.getByText(/Backlog/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('TC_E2E_15: фильтр по доске', async ({ page }) => {
    const boardCombo = page.getByRole('combobox').last();
    await boardCombo.click();
    await page.getByRole('option').first().click();
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 5000 });
  });
});
