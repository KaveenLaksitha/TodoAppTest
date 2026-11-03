import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  const todos = await (await request.get('/api/todos')).json();
  for (const todo of todos) await request.delete(`/api/todos/${todo.id}`);
});

test('create, edit, filter, complete, reload, and delete through the real database', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByText('A little space for a fresh start.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByRole('alert')).toContainText('Give your task a title');
  await page.getByLabel('Task title').fill('Plan the launch');
  await page.getByLabel('Description').fill('Review the checklist');
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(
    page.getByRole('heading', { name: 'Plan the launch' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Edit Plan the launch' }).click();
  await page.getByLabel('Task title').fill('Plan tomorrow');
  await page.getByLabel('Description').fill('Updated details');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText('Updated details')).toBeVisible();
  await page
    .getByRole('checkbox', { name: 'Mark Plan tomorrow as completed' })
    .click();
  await expect(
    page.getByRole('checkbox', { name: 'Mark Plan tomorrow as active' }),
  ).toBeEnabled();
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '100',
  );
  await page.reload();
  await expect(
    page.getByRole('checkbox', { name: 'Mark Plan tomorrow as active' }),
  ).toBeVisible();
  await page
    .getByRole('group', { name: 'Filter tasks' })
    .getByRole('button', { name: 'Active' })
    .click();
  await expect(page.getByText('All caught up. Take a breath.')).toBeVisible();
  await page
    .getByRole('group', { name: 'Filter tasks' })
    .getByRole('button', { name: 'Completed' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Plan tomorrow' }),
  ).toBeVisible();
  await page.getByRole('searchbox').fill('no match');
  await expect(page.getByText('No tasks found.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await page.getByRole('button', { name: 'Delete Plan tomorrow' }).click();
  await page.getByRole('button', { name: 'Keep task' }).click();
  await expect(
    page.getByRole('heading', { name: 'Plan tomorrow' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete Plan tomorrow' }).click();
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Plan tomorrow' }),
  ).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Task deleted');
  await page.reload();
  await expect(
    page.getByText('A little space for a fresh start.'),
  ).toBeVisible();
});

test('failed completion, edit, and delete requests restore the original task', async ({
  page,
  request,
}) => {
  await request.post('/api/todos', {
    data: { title: 'Keep this task', description: 'Original details' },
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Keep this task' }),
  ).toBeVisible();
  await page.route('**/api/todos/**', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Test server failure.' }),
    }),
  );
  await page.getByRole('checkbox').click();
  await expect(page.getByRole('alert')).toContainText(
    'Your task has been restored',
  );
  await expect(page.getByRole('checkbox')).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await page.getByRole('button', { name: 'Edit Keep this task' }).click();
  await page.getByLabel('Task title').fill('Changed title');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Test server failure',
  );
  await expect(
    page.getByRole('heading', { name: 'Keep this task' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Keep this task' }).click();
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Keep this task' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'Your task has been restored',
  );
});

test('initial connection errors can be retried', async ({ page }) => {
  await page.route('**/api/todos', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText(
    'We couldn’t load your tasks',
  );
  await page.unroute('**/api/todos');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(
    page.getByText('A little space for a fresh start.'),
  ).toBeVisible();
});

test('mobile layout fits the viewport and keyboard can dismiss the task dialog', async ({
  page,
  request,
}) => {
  await request.post('/api/todos', {
    data: {
      title: 'Take a small step',
      description: 'Start with something simple.',
    },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Take a small step' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'New task' }).click();
  await expect(page.getByLabel('Task title')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
