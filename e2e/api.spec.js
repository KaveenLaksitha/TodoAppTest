import { test, expect } from '@playwright/test';

test('MongoDB stores trimmed fields, timestamps, and atomic concurrent toggles', async ({
  request,
}) => {
  const response = await request.post('/api/todos', {
    data: { title: '  Database check  ', description: '  Details  ' },
  });
  expect(response.status()).toBe(201);
  const todo = await response.json();
  expect(todo.title).toBe('Database check');
  expect(todo.description).toBe('Details');
  expect(todo.done).toBe(false);
  expect(todo.id).toMatch(/^[a-f\d]{24}$/);
  expect(Number.isNaN(Date.parse(todo.createdAt))).toBe(false);
  try {
    const toggles = await Promise.all(
      Array.from({ length: 10 }, () =>
        request.patch(`/api/todos/${todo.id}/done`),
      ),
    );
    for (const toggle of toggles) expect(toggle.status()).toBe(200);
    let stored = (await (await request.get('/api/todos')).json()).find(
      (item) => item.id === todo.id,
    );
    expect(stored.done).toBe(false);
    await request.put(`/api/todos/${todo.id}`, {
      data: { title: 'Edited in MongoDB' },
    });
    stored = (await (await request.get('/api/todos')).json()).find(
      (item) => item.id === todo.id,
    );
    expect(stored.title).toBe('Edited in MongoDB');
    expect(stored.description).toBe('');
    expect(Date.parse(stored.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(stored.createdAt),
    );
  } finally {
    expect((await request.delete(`/api/todos/${todo.id}`)).status()).toBe(204);
  }
});
