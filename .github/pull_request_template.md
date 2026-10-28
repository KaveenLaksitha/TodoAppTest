## Summary

Daylight is a React, Express, and MongoDB TODO application with task creation, editing, completion toggles, and deletion. It includes responsive styling, search and status filters, validation, loading/error states, and optimistic updates with rollback.

## Solution rationale

- npm workspaces keep frontend and backend independently runnable with a single lockfile.
- Express routes and a small Mongoose repository keep HTTP behavior separate from persistence.
- Local React state fits the scope; same-origin API calls simplify development and production setup.
- An atomic database toggle prevents lost status changes from overlapping requests.

## Validation

<!-- Replace with commands actually run and their outcomes. -->

## Demo video

<!-- Add your actual short demo recording link. -->

## Five-minute code walkthrough

<!-- Add your actual walkthrough recording link. -->

## Limitations

One shared task list with no authentication, pagination, or live synchronization. See the frontend and backend READMEs for setup and assumptions.
