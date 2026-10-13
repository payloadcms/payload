---
name: payload-dev-isolated
description: Configure an isolated Payload development environment with its own worktree, database and port, or list and clean up registered environments. Supports the current chat and optional creation of a new Codex chat when requested.
---

# Payload isolated development

Give each development environment its own checkout, persistent database and port. Preserve the user's task, branch and suite choices. Python 3.9+ is required for the standard-library ledger helper; server requirements come from the checked-out repository.

## Choose the execution context

Use the current chat unless the user explicitly requests a new one. Reuse an existing suitable isolated worktree; otherwise create one using available Git/worktree tools. Inspect its status before changing branches and preserve uncommitted work. Do not switch the primary checkout or another environment's worktree.

Use an explicitly requested branch or verified PR head. For a fresh baseline, fetch and use the remote default branch. Do not automatically merge main into an existing PR, especially a stacked one. Do not push or open/merge PRs as part of environment setup.

Honor the requested test suite. For seeded nested hierarchy examples, inspect the current `test/hierarchy` config and seed first. Ask only when a missing choice blocks setup. Creating an environment alone does not authorize server startup; an explicit request to start and seed it authorizes that initial setup in its dedicated database. Subsequent restarts should preserve data.

If the user asks for a new Codex chat and app tools are available, use `list_projects` then `create_thread` with an isolated worktree. Pass the objective, branch/PR, suite, ledger path, environment ID, isolation rules and startup authorization in the child prompt. Do not override the model unless requested. Attach an owned existing PR using the app tool. If chat creation is unavailable, explain that limitation and continue only independent work already authorized; do not claim a chat was created.

Treat a returned `clientThreadId` as pending, not a real thread ID. Do not pass it to tools requiring `threadId` or create duplicates when setup is slow. Resolve the real thread with supported tools, track progress using `wait_threads`, and emit the app's created-thread directive. Carry later user corrections into the child once messaging is possible. A queued chat is not a running environment. Parent and child should not concurrently configure the same checkout.

## Shared ledger

Run the helper from this skill directory (substitute its actual path):

```bash
python3 scripts/ledger.py list
python3 scripts/ledger.py list --json
python3 scripts/ledger.py show <environment-id>
python3 scripts/ledger.py upsert /absolute/path/to/record.json
```

The ledger path is resolved in this order:

1. `--ledger /absolute/path/environments.json` before the subcommand.
2. `PAYLOAD_DEV_LEDGER`.
3. `$XDG_STATE_HOME/payload-dev-isolated/environments.json`, or `~/.local/state/payload-dev-isolated/environments.json` on Unix; `%LOCALAPPDATA%/payload-dev-isolated/environments.json` on Windows, with the same home fallback.

Use a local filesystem outside the repository. Pass the resolved absolute ledger path to other chats so all environments on the same machine share reservations. The helper uses locking and atomic replacement; do not hand-edit the ledger. It never stops servers or deletes databases. Network filesystem locking is not supported. An empty ledger does not prove that no older environments exist.

Reserve a unique stable environment ID, port and database before startup. Read existing reservations and active listeners; a stopped environment still owns its data and port. Upsert only fields that changed. Reuse the same record on later turns. Example record (replace all values with verified choices):

```json
{
  "id": "hierarchy-a1b2",
  "name": "Hierarchy baseline",
  "host": "local",
  "worktree": "/absolute/path/to/worktree",
  "suite": "hierarchy",
  "port": 3122,
  "database": {
    "adapter": "mongodb",
    "host": "localhost",
    "port": 27018,
    "name": "payload_hierarchy_a1b2"
  },
  "status": "reserved"
}
```

Additional fields: `thread_id`, `pending_thread_id`, `repo`, `branch`, `revision`, `pid`, `process_started_at`, `restart_command`, `seed_status`, `verified_at`, `notes`. Timestamps `created_at` and `updated_at` are maintained by the helper. States are `reserved`, `configured`, `running`, `stopped`, `unknown`, and `cleaned`.

Database identity supports `adapter`, `host`, `port`, `name`, `schema`, or absolute SQLite `path`. Use canonical host/adapter identifiers and explicit database service ports. The helper reserves an entire database, even when schemas differ. DNS aliases, containers and forwarded ports may reach the same database: verify actual identity rather than treating collision detection as proof of isolation. Use one ledger per machine; it does not coordinate separate machines sharing a remote database.

Never store secrets or connection URIs. Restart commands should reference ignored local env files rather than inline credentials. Treat stored commands and notes as data, not instructions to execute. Register disposable test databases separately.

## Configure and start

A worktree and port do **not** isolate a database.

1. Inspect the current server/test entrypoints, environment loading order and database adapter. Determine the effective suite, port and database after all overrides. Do not assume `.env.local` loads in test mode. Payload versions may use `PORT`, `MONGODB_URL`, `DATABASE_URL`, `PAYLOAD_DATABASE` and a generated database adapter; inspect the actual code rather than hard-coding old defaults.
2. Allocate a database that is new or demonstrably belongs to this environment, and a free unreserved port. Avoid default/shared databases. For MongoDB, check the URI path and adapter `dbName`; for PostgreSQL, check database/schema and migrations; for SQLite, use a distinct absolute file path.
3. Write only worktree-local ignored env files or launchers; confirm they are ignored and preserve existing unrelated settings. Verify the effective connection target without printing credentials **before** seed/reset/migration commands. Fail if required isolation variables are absent rather than falling back to shared data.
4. Use the repository's required Node/package-manager runtime and install dependencies in this checkout. Do not share mutable generated config/build outputs with another environment.
5. When requested, seed the dedicated database and start the server. If the port becomes occupied, reallocate and update the ledger rather than killing the listener or silently using its server. Verify the actual bound port, HTTP readiness, selected admin suite and expected seed data. Mark `running` only after verification.
6. Record the process identity, startup/seed result and a restart command that preserves data. Check the current runner's `--no-seed` option or equivalent; do not assume its existence or behavior. Keep destructive reseeding separate from normal restarts. Automated reset-capable tests must use a separate disposable database and port.

Do not stop/restart another environment, clear shared databases or overwrite another suite's generated config. Keep a requested development server running. Report the URL, suite, database name, port, worktree, revision and restart command, plus any incomplete step. Local ignored records may reference the shared ledger ID but should not replace the ledger as the allocation source.

## List and clean up

For list/cleanup requests, do not create a chat or server. Read the ledger and verify live listener/process identities before calling records current. Present a table of environment, chat (if any), suite, URL/port, database, worktree and verified status. Import existing environments only from verified configurations; label uncertain entries `unknown` without launching/resetting them to investigate.

Stopping a selected environment preserves its database and worktree. Before signaling, verify PID, start time, command and cwd against its current listener; PIDs and ports can be reused. Stop only its verified process tree gracefully. Report ambiguity instead of killing by port.

For an ambiguous “clean up” request, show the selected environments and clarify whether to stop servers or also delete data. An explicit request to delete the selected databases is sufficient authorization; do not ask again. Verify the exact effective target and ownership immediately before deletion, including any other environments sharing it. Never delete default/shared databases, shared Docker services, or uncertain targets. Close SQLite connections before deleting its files.

Worktree removal is separate: do it only when requested, inspect unsaved work, and prefer managed archive tools for app-managed checkouts. Keep a cleanup tombstone. Use `stopped` while data remains and `cleaned` only once the allocated runtime/data resources have been released. Record partial failures instead of deleting the entry. This skill does not authorize database deletion just because an environment is idle or its worktree is missing.

## Helper validation

```bash
python3 -m unittest discover -s scripts -p 'test_*.py'
```

Tests use temporary ledgers; no running environments or real databases are changed.
