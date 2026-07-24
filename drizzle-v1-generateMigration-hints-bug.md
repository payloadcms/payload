# Bug report: drizzle-kit v1 `generateMigration` cannot resolve create/delete ambiguity programmatically (no `HintsHandler`)

## Summary

The Payload-facing programmatic migration API exported by drizzle-kit v1
(`drizzle-kit/payload/postgres`, `drizzle-kit/payload/sqlite`, and the equivalent
`drizzle-kit/api-*` entrypoints) exposes `generateMigration(prev, cur)`. Internally it invokes
drizzle-kit's rename/create resolver **without a `HintsHandler`** and with **no way for the
caller to provide one or to enable interactive mode**. As a result, whenever a diff contains
both created and deleted entities of the same kind (a table or a column) — i.e. any change that
_could_ be a rename — `generateMigration` throws:

```
Internal error: resolver(table) was called without a HintsHandler
```

There is no programmatic escape hatch: the resolver falls back to interactive (TTY) prompting,
but interactive mode is gated on an `AsyncLocalStorage` context (`cliContext`) that is
module-internal and not exported, so a non-CLI caller cannot turn it on either.

- **drizzle-orm / drizzle-kit version:** `1.0.0-rc.4`
- **Affected export:** `generateMigration` from `drizzle-kit/payload/{postgres,sqlite,mysql,mssql}` and `drizzle-kit/api-{postgres,sqlite}`
- **Not affected:** `pushSchema` (it constructs its own `new HintsHandler()` internally), and any diff that has _no_ create+delete ambiguity.

## Environment

- Node: 24.x
- drizzle-orm: `1.0.0-rc.4`
- drizzle-kit: `1.0.0-rc.4`
- Consumer: [Payload CMS](https://github.com/payloadcms/payload) `@payloadcms/drizzle`, which uses the programmatic API to generate migration SQL from two in-memory schema snapshots (its `blocksToJSON` data-migration helper), rather than through the drizzle-kit CLI.

## Root cause

In the shipped `drizzle-kit/payload-{postgres,sqlite}.js` bundles:

`generateMigration` calls the resolver with only the entity kind — no hints argument:

```js
// payload-postgres.js / payload-sqlite.js
const generateMigration = async (prev, cur) => {
  const { resolver } = await import(/* prompts */);
  const { ddlDiff } = await import(/* diff */);
  const from = createDDL(); const to = createDDL();
  for (const it of prev.ddl) from.entities.push(it);
  for (const it of cur.ddl)  to.entities.push(it);
  const { sqlStatements } = await ddlDiff(
    from, to,
    resolver("table"),   // <-- hints arg omitted -> hints === undefined
    resolver("column"),  // <-- hints arg omitted -> hints === undefined
    "default",
  );
  return sqlStatements;
};
```

The resolver signature is `(entity, hints, defaultSchema = "public")`, and its behavior is:

```js
resolver =
  (entity, hints, defaultSchema = 'public') =>
  async (it) => {
    const { created, deleted } = it
    if (created.length === 0 || deleted.length === 0) {
      return { created, deleted, renamedOrMoved: [] } // unambiguous -> fine
    }
    const resolveFromHints = async () => {
      if (!hints)
        throw new Error(`Internal error: resolver(${entity}) was called without a HintsHandler`)
      // ...consult hints...
    }
    const resolveTtyMode = async () => {
      /* interactive hanji prompt */
    }
    return isInteractive() ? resolveTtyMode() : resolveFromHints()
  }
```

`isInteractive()` reads from a module-internal `AsyncLocalStorage`:

```js
cliContext = new AsyncLocalStorage()
getCliContext = () => cliContext.getStore() ?? { output: 'text', interactive: false }
isInteractive = () => getCliContext().interactive // default false, hardcoded
```

So for a programmatic (non-CLI) caller:

- `isInteractive()` → `false` (the `cliContext` store is never set; `cliContext` is not exported, so the caller cannot set it), therefore
- the resolver takes the `resolveFromHints()` branch, and
- `hints` is `undefined` (because `generateMigration` calls `resolver("table")` with no second arg), therefore
- it throws `resolver(table) was called without a HintsHandler`.

By contrast, `pushSchema` works because it explicitly builds a handler:

```js
const pushSchema = async (imports, db, migrationsConfig) => {
  // ...
  const { HintsHandler } = await import(/* hints */);
  const hints = await suggestions(db, statements, new HintsHandler()); // <-- provides a handler
  // ...
};
```

## Reproduction

Any two snapshots whose `ddl` diff contains a create **and** a delete for the same entity kind
triggers it. Minimal shape:

```ts
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/payload/postgres'
import { pgTable, integer, text } from 'drizzle-orm/pg-core'

// snapshot "before": has table `a`
const before = await generateDrizzleJson({
  a: pgTable('a', { id: integer('id').primaryKey() }),
})

// snapshot "after": table `a` is gone, table `b` is new
// => table resolver sees created=[b], deleted=[a] => ambiguity => needs hints
const after = await generateDrizzleJson({
  b: pgTable('b', { id: integer('id').primaryKey(), name: text('name') }),
})

await generateMigration(before, after)
// throws: Internal error: resolver(table) was called without a HintsHandler
```

(The same happens on a single table when columns are simultaneously added and dropped, via
`resolver("column")`.)

### How Payload hits it

`@payloadcms/drizzle`'s `blocksToJSON` migrator generates two schema snapshots — one with the
block sub-tables, one with the block data collapsed into a JSON column — and calls
`generateMigration(before, after)` to produce the up/down SQL. That diff drops the block tables
and creates the replacement structure, which the resolver flags as ambiguous.

## Expected behavior

One of:

1. `generateMigration` accepts an optional hints/resolver argument (e.g. an empty
   `HintsHandler`, or a `{ onRename, onCreate }` callback), so a programmatic caller can say
   "treat everything as create/delete, no renames" — mirroring how `pushSchema` already
   constructs `new HintsHandler()` internally; **or**
2. `generateMigration` defaults to a non-throwing empty `HintsHandler` when none is supplied and
   the process is non-interactive (so ambiguous entities resolve as drop + create), instead of
   throwing; **or**
3. drizzle-kit exports a way to run a call within an interactive/hinted `cliContext`
   (e.g. `withHints(handler, () => generateMigration(...))`), so callers can opt into a
   resolution strategy.

## Actual behavior

`generateMigration` throws `Internal error: resolver(<entity>) was called without a HintsHandler`
for any diff with rename ambiguity, and the caller has no supported way to provide hints or
enable interactive resolution.

## Impact

- Blocks any programmatic use of `generateMigration` for migrations that add + remove
  tables/columns in the same step (renames, restructures, table splits/merges).
- For Payload specifically, it blocks the `blocksToJSON` data-migration helper on both Postgres
  and SQLite. All other Payload migration paths (normal `create`, the v2→v3 predefined
  migration) work because their diffs are not ambiguous.

## Workarounds attempted (all unsuccessful)

- **Provide an empty `HintsHandler`** — `generateMigration(prev, cur)` takes no hints argument;
  there's no seam to pass one.
- **Enable interactive mode + auto-answer prompts** (the pre-v1 approach of emitting synthetic
  `keypress`/`return` events on stdin) — `resolveTtyMode()` is only reached when
  `isInteractive()` is `true`, and that is driven solely by the unexported module-internal
  `cliContext` `AsyncLocalStorage`; there is no env var, flag, or export to flip it.
- **Use `pushSchema` instead** — it handles ambiguity (creates its own `HintsHandler`), but it
  diffs a live DB against a schema, so it can't diff two arbitrary in-memory snapshots the way
  `generateMigration` does. It's unsuitable for generating a migration file at build time.

## References (drizzle-kit `1.0.0-rc.4` shipped bundles)

- `node_modules/drizzle-kit/payload-postgres.js` — `generateMigration` (calls `resolver("table")` / `resolver("column")` with no hints) and `pushSchema` (constructs `new HintsHandler()`).
- `node_modules/drizzle-kit/payload-sqlite.js` — same pattern; also `HintsHandler` class definition and `resolver` (the `if (!hints) throw ...` guard and the `isInteractive() ? resolveTtyMode() : resolveFromHints()` branch).
- `cliContext` / `getCliContext` / `isInteractive` — module-internal `AsyncLocalStorage`, defaulting to `{ output: "text", interactive: false }`, not exported.
