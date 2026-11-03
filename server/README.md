# Daylight backend

Express 5 and Mongoose 8 on Node.js 22.9+. MongoDB stores the task list; there is no runtime in-memory fallback.

## Setup

From the repository root:

```sh
npm install
cp server/.env.example server/.env
```

Edit `server/.env`:

```dotenv
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/daylight
```

Start a local MongoDB 7+ instance, or run `docker compose up -d` at the repository root. Then:

```sh
npm run dev -w server
```

The server waits for MongoDB before listening on **http://localhost:3001**. Run `npm run dev` at the root to start both workspaces. `npm start` runs without watch mode and also serves `client/dist` if the frontend has been built.

### MongoDB Atlas

Create a database user, allow your current IP in Atlas network access, and copy the Node.js connection string into `MONGODB_URI`, including a database name such as `daylight`. URL-encode special characters in the password. Do not commit `.env`; it is ignored. Connection errors commonly mean incorrect credentials, an unlisted IP, an inactive local database, or an unreachable hostname. Local `127.0.0.1` avoids IPv6/IPv4 localhost mismatches.

## API

JSON request bodies use `Content-Type: application/json`.

| Method | Endpoint              | Success                                 |
| ------ | --------------------- | --------------------------------------- |
| GET    | `/api/todos`          | `200`, array ordered newest first       |
| POST   | `/api/todos`          | `201`, created task and Location header |
| PUT    | `/api/todos/:id`      | `200`, updated task                     |
| PATCH  | `/api/todos/:id/done` | `200`, task with completion toggled     |
| DELETE | `/api/todos/:id`      | `204`, no response body                 |

POST and PUT accept a required `title` string and optional `description` string. PUT replaces editable fields; omitting the description clears it. Whitespace is trimmed. Titles must contain 1–120 characters after trimming; descriptions allow 0–2,000. `done` may only be changed through the toggle endpoint. Other fields are rejected.

```sh
curl -X POST http://localhost:3001/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Plan the day","description":"Pick three things that matter"}'
```

Example task:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Plan the day",
  "description": "Pick three things that matter",
  "done": false,
  "createdAt": "2026-10-28T08:00:00.000Z",
  "updatedAt": "2026-10-28T08:00:00.000Z"
}
```

Errors return `{ "error": "Readable message" }`: `400` for invalid input, invalid IDs, or malformed JSON; `404` for missing tasks/routes; `413` for request bodies over 16 KB; `500` for unexpected failures. Internal errors are logged server-side, without sending database details to the client. API responses are not cached.

## Tests

```sh
npm test
```

HTTP tests exercise all five routes, validation, invalid IDs, missing tasks, malformed JSON, and request-size limits. The repository double isolates these tests from the database; it does not replace production persistence or verify MongoDB behavior.

For real database verification, run `npx playwright install chromium` followed by `npm run test:e2e` at the root. The suite starts a disposable MongoDB instance and tests the actual Mongoose repository, including ten concurrent toggles. Browser tests cover CRUD, reload persistence, failed-update rollback, retry, and mobile interaction. This test database is isolated from `MONGODB_URI` and removed on shutdown. The first run needs network access to download the MongoDB binary.

## Assumptions and limitations

No authentication or user ownership: all callers share the same list. No pagination, rate limiting, or multi-user conflict resolution beyond an atomic status toggle. Updates otherwise use last-write-wins. This API is scoped to a local assignment; production use needs authentication, deployment-specific security controls, and database backups. SIGINT/SIGTERM drain HTTP connections and close Mongoose, with a 10-second forced-exit deadline.
