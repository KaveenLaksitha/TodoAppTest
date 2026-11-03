# Submission guide

The implementation lives on `develop`, with the initial scaffold on `main`. Review the work and ensure you understand the code and your evaluator’s AI-assistance policy before submitting.

## Publishing checklist

1. Create a public repository in your own GitHub account. Keep the local history when adding its remote.
2. Push `main` and `develop`.
3. Open a pull request from `develop` to `main` in your repository.
4. Fill in the summary, rationale, and actual recording links. Do not leave placeholders.
5. Submit the repository/PR URL through the form in the assignment email.

The repository includes a PR template. No remote repository, PR, recording, or form submission is created by the local application setup.

## Demo outline (about 90 seconds)

1. Start on an empty task list and show the responsive workspace.
2. Create a task with a description and one without.
3. Edit a title and description; demonstrate required-title validation.
4. Mark a task done, show the completed filter and progress, then mark it active again.
5. Search for a task, clear the query, and change sort order.
6. Cancel a delete, then confirm it. Reload to demonstrate persistence.
7. Briefly show a narrow viewport and the API-unavailable retry state.

## Code walkthrough (five minutes)

- **0:00–0:45:** root workspace scripts, client/server boundaries, and setup.
- **0:45–1:45:** Mongoose model, timestamps, repository methods, atomic toggle, and startup connection.
- **1:45–2:45:** Express route contracts, strict validation, ID checks, status codes, and error middleware.
- **2:45–4:00:** React list state, derived search/filter/progress, editor dialogs, optimistic mutations, per-task locks, and rollback.
- **4:00–4:40:** HTTP tests, database/browser checks, and production build.
- **4:40–5:00:** tradeoffs: shared list, no pagination/auth/live sync, and what you would add next.

Record these yourself so the walkthrough reflects your understanding. Use real recordings and state only checks you have actually run.
