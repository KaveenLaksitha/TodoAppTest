import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';

// Only persistence is replaced; requests pass through the actual Express routes.
const rows = new Map();
let sequence = 0;
const repository = {
  list: async () => [...rows.values()],
  create: async (data) => {
    const todo = {
      ...data,
      id: (++sequence).toString(16).padStart(24, '0'),
      done: false,
    };
    rows.set(todo.id, todo);
    return todo;
  },
  update: async (id, data) =>
    rows.has(id) ? rows.set(id, { ...rows.get(id), ...data }).get(id) : null,
  toggle: async (id) =>
    rows.has(id)
      ? rows.set(id, { ...rows.get(id), done: !rows.get(id).done }).get(id)
      : null,
  remove: async (id) => {
    const row = rows.get(id);
    rows.delete(id);
    return row;
  },
};
let server;
let base;
before(async () => {
  server = createApp(repository).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api/todos`;
});
after(
  () => server?.listening && new Promise((resolve) => server.close(resolve)),
);
const request = (method, suffix = '', body) =>
  fetch(base + suffix, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

test('complete task lifecycle: create, list, edit, toggle twice, delete', async () => {
  assert.deepEqual(await (await request('GET')).json(), []);
  const created = await request('POST', '', { title: '  Plan the day  ' });
  assert.equal(created.status, 201);
  const todo = await created.json();
  assert.equal(todo.title, 'Plan the day');
  assert.equal(todo.description, '');
  assert.equal(todo.done, false);
  assert.equal(created.headers.get('location'), `/api/todos/${todo.id}`);
  assert.equal((await (await request('GET')).json()).length, 1);
  const edited = await (
    await request('PUT', `/${todo.id}`, {
      title: 'Plan tomorrow',
      description: 'At the desk',
    })
  ).json();
  assert.equal(edited.title, 'Plan tomorrow');
  assert.equal(edited.description, 'At the desk');
  assert.equal(
    (await (await request('PATCH', `/${todo.id}/done`)).json()).done,
    true,
  );
  assert.equal(
    (await (await request('PATCH', `/${todo.id}/done`)).json()).done,
    false,
  );
  assert.equal((await request('DELETE', `/${todo.id}`)).status, 204);
  assert.deepEqual(await (await request('GET')).json(), []);
});

test('rejects empty, oversized, non-text, and unexpected fields', async () => {
  for (const body of [
    null,
    [],
    {},
    { title: ' ' },
    { title: 1 },
    { title: 'a'.repeat(121) },
    { title: 'Task', description: 123 },
    { title: 'Task', description: 'a'.repeat(2001) },
    { title: 'Task', done: true },
    { title: 'Task', $set: { done: true } },
  ]) {
    const response = await request('POST', '', body);
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, 'string');
  }
});

test('returns useful errors for invalid IDs, missing tasks, and malformed JSON', async () => {
  assert.equal((await request('DELETE', '/bad-id')).status, 400);
  for (const method of ['PUT', 'PATCH', 'DELETE']) {
    const suffix =
      '/ffffffffffffffffffffffff' + (method === 'PATCH' ? '/done' : '');
    assert.equal(
      (
        await request(
          method,
          suffix,
          method === 'PUT' ? { title: 'Missing' } : undefined,
        )
      ).status,
      404,
    );
  }
  const malformed = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(malformed.status, 400);
  assert.equal((await fetch(base + '/unknown')).status, 404);
});

test('rejects oversized request bodies', async () => {
  assert.equal(
    (
      await request('POST', '', {
        title: 'Task',
        description: 'a'.repeat(20000),
      })
    ).status,
    413,
  );
});
