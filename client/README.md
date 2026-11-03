# Daylight frontend

React 19, Vite, plain CSS, and Lucide icons. The UI provides creation and editing dialogs, confirmation before deleting, done/undone toggles, full-text substring search, status filters, sort order, and a completion summary.

## Setup

From the repository root:

```sh
npm install
cp server/.env.example server/.env
# Configure MongoDB; see ../server/README.md.
npm run dev
```

Visit **http://localhost:5173**. To run only the frontend, use `npm run dev -w client`; the backend must be running separately on port 3001. `client/vite.config.js` forwards `/api` requests to it.

```sh
npm run build -w client
npm run preview -w client
```

The build is written to `client/dist`. Vite preview only previews static files and does not proxy the API. For a working production-style preview, run `npm run build` and `npm start` from the root, then visit **http://localhost:3001**.

## Verification

From the root, run `npx playwright install chromium` once, then `npm run test:e2e`. Playwright uses the production build, Express, and an isolated temporary MongoDB instance. Tests exercise CRUD, persistence after reload, filters/search, failure rollback, initial-error retry, mobile overflow, and keyboard dialog dismissal. No existing task database is used. `npm run check` runs the fast API tests, production build, and formatting check.

## Interaction and errors

- Task titles are required and limited to 120 characters; optional descriptions allow 2,000 characters.
- Edits, done toggles, and deletes are optimistic and roll back on failure. Only the affected row is locked during its request.
- Creation waits for a successful API response. Failed saves keep the dialog open and retain the input.
- Initial errors show a retry action; mutation errors stay visible until dismissed. Success notifications disappear after four seconds.
- Native modal dialogs provide focus containment and Escape handling. Destructive confirmation initially focuses the safe action. Buttons and checkboxes have accessible names, notifications announce status, and motion respects reduced-motion preferences.

## Assumptions and limitations

One shared list, no login, no router, and no local/offline persistence. MongoDB is the source of truth. A browser refresh fetches the latest server state; changes in other tabs are not pushed automatically. Search covers titles and descriptions already loaded from the API. All counts describe the full list; the footer describes the current filtered results. External Google Fonts are optional and fall back to system fonts.
