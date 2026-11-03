import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientDist = fileURLToPath(
  new URL('../../client/dist/', import.meta.url),
);

function validateTodo(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return 'Send a JSON object.';
  if (
    Object.keys(body).some((key) => !['title', 'description'].includes(key))
  ) {
    return 'Only title and description can be edited here.';
  }
  if (typeof body.title !== 'string' || !body.title.trim())
    return 'Please enter a task title.';
  if (body.title.trim().length > 120)
    return 'Keep the title to 120 characters or fewer.';
  if (body.description !== undefined && typeof body.description !== 'string')
    return 'Description must be text.';
  if ((body.description?.trim().length ?? 0) > 2000)
    return 'Keep the description to 2,000 characters or fewer.';
  return null;
}

export function createApp(repository) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.param('id', (req, res, next, id) => {
    if (!/^[a-f\d]{24}$/i.test(id))
      return res.status(400).json({ error: 'Invalid task ID.' });
    next();
  });

  app.get('/api/todos', async (_req, res) => res.json(await repository.list()));

  app.post('/api/todos', async (req, res) => {
    const error = validateTodo(req.body);
    if (error) return res.status(400).json({ error });
    const todo = await repository.create({
      title: req.body.title.trim(),
      description: req.body.description?.trim() ?? '',
    });
    res.status(201).location(`/api/todos/${todo.id}`).json(todo);
  });

  app.put('/api/todos/:id', async (req, res) => {
    const error = validateTodo(req.body);
    if (error) return res.status(400).json({ error });
    const todo = await repository.update(req.params.id, {
      title: req.body.title.trim(),
      description: req.body.description?.trim() ?? '',
    });
    if (!todo)
      return res
        .status(404)
        .json({ error: 'This task no longer exists. Refresh your list.' });
    res.json(todo);
  });

  app.patch('/api/todos/:id/done', async (req, res) => {
    const todo = await repository.toggle(req.params.id);
    if (!todo)
      return res
        .status(404)
        .json({ error: 'This task no longer exists. Refresh your list.' });
    res.json(todo);
  });

  app.delete('/api/todos/:id', async (req, res) => {
    const todo = await repository.remove(req.params.id);
    if (!todo)
      return res
        .status(404)
        .json({ error: 'This task no longer exists. Refresh your list.' });
    res.status(204).end();
  });

  app.use('/api', (_req, res) =>
    res.status(404).json({ error: 'API endpoint not found.' }),
  );
  app.use(express.static(clientDist));
  app.get('/', (_req, res, next) => {
    res.sendFile(path.join(clientDist, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
  app.use((_req, res) => res.status(404).json({ error: 'Page not found.' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed')
      return res.status(400).json({ error: 'Request contains invalid JSON.' });
    if (error.type === 'entity.too.large')
      return res
        .status(413)
        .json({ error: 'This task is too large. Please shorten it.' });
    console.error(error);
    res
      .status(500)
      .json({ error: 'We couldn’t save your changes. Please try again.' });
  });
  return app;
}
