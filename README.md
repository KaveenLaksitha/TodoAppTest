# Daylight

A small, full-stack TODO app built with React, Express, and MongoDB. Create tasks with optional descriptions, edit them, mark them complete, and delete them. Search, status filters, progress tracking, and optimistic updates keep the interface quick and focused.

## Run locally

Requires **Node.js 22.9+** and a running **MongoDB 7+** instance (local or Atlas).

```sh
npm install
cp server/.env.example server/.env
# Set MONGODB_URI in server/.env if needed.
npm run dev
```

Open **http://localhost:5173**. Vite forwards `/api` to Express on port 3001. The API connects to MongoDB before accepting requests; a missing or unreachable database produces a startup error with connection details.

If Docker is available, a local database can be started with:

```sh
docker compose up -d
```

For Atlas setup and troubleshooting, see [the backend README](server/README.md). For UI details, see [the frontend README](client/README.md).

## Commands

| Command            | Purpose                                               |
| ------------------ | ----------------------------------------------------- |
| `npm run dev`      | Start both development servers                        |
| `npm test`         | Run HTTP API tests without a database                 |
| `npm run build`    | Build the React production bundle                     |
| `npm start`        | Serve API and built frontend together on port 3001    |
| `npm run check`    | Run API tests, production build, and formatting check |
| `npm run test:e2e` | Run browser and real-MongoDB integration checks       |
| `npm run format`   | Format source and documentation with Prettier         |

For end-to-end tests, first run `npx playwright install chromium`, then `npm run test:e2e`. The test harness starts a disposable MongoDB instance on a free port and serves the built app on port 3002. MongoDB Memory Server downloads a MongoDB binary on first use, so initial installation/testing requires internet access. It never connects to your configured database. Browser checks cover the full task lifecycle, reload persistence, failed-write rollback, loading-error recovery, and mobile layout/keyboard behavior. A database integration check also exercises concurrent atomic toggles and stored fields.

For production-style local usage, run `npm run build` then `npm start`. Set `MONGODB_URI` and optionally `PORT` in the environment or `server/.env`. Keep the Vite development server on its default port; if the API port changes, update its proxy target in `client/vite.config.js`.

## Structure and decisions

```text
client/                 React + Vite workspace
  src/main.jsx          React entry point
  src/App.jsx           Task workspace and state
  src/TaskDialogs.jsx   Task editor and delete confirmation
  src/api.js            HTTP requests and readable API errors
  src/styles.css        Responsive styling and reduced-motion support
server/                 Express + Mongoose workspace
  src/app.js            Routes, validation, errors, static frontend
  src/todo.js           Schema and database operations
  src/index.js          Connection, startup, graceful shutdown
  test/api.test.js      HTTP tests using an in-memory repository double
docs/submission.md      Demo and code walkthrough guide
```

- **npm workspaces:** one install and lockfile, with independently runnable client and server packages.
- **React state:** the scope is small enough for local state. No router, global store, or caching library is necessary.
- **Express + Mongoose:** explicit REST endpoints and a small repository boundary keep database operations separate from request validation and make HTTP tests independent of MongoDB.
- **Same-origin requests:** the Vite proxy handles development, and Express serves the production frontend. No permissive CORS policy is needed.
- **Optimistic changes:** edits, completion toggles, and deletes update immediately, lock the affected task while saving, and restore it if the API fails. Creation waits for MongoDB to return its ID; the form retains its text on failure.
- **Atomic toggle:** MongoDB updates the completion flag with a single update pipeline, avoiding a read-then-save race.
- **Validation:** title is required (120 characters), description is optional (2,000 characters). Values are trimmed. Unexpected fields and invalid task IDs are rejected.

## Assumptions and limitations

This is a single-user exercise with one shared task list. There is no authentication, user isolation, pagination, or live synchronization between tabs. The API should be placed behind authentication before exposing private tasks publicly. Delete requires confirmation and is permanent. All tasks are fetched at once; a larger application would add server-side pagination/search. Fonts load from Google Fonts with system font fallbacks. Dates use the viewer’s local timezone. There are no preloaded demo tasks.

See [the submission guide](docs/submission.md) for the repository/PR requirements and recording outlines. Recordings, repository publishing, and the email submission must be completed separately.
