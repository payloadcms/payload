# TypeScript 7.0 beta (tsgo) vs 5.7.3 (tsc) benchmark

Host: macOS (Darwin 24.6.0, arm64), Node 24.13.0, pnpm 10.27.0.
Baseline: `typescript@5.7.3`. TS7: `@typescript/native-preview@7.0.0-dev.20260421.2`.
All runs: fresh `pnpm clean:build`, Turbo cache disabled (`--no-cache --force`), 1 run each.
Peak RSS measured with `/usr/bin/time -l`.

All runs below are on a tree where the TS7-exposed issues have been fixed, so both tsc and tsgo complete the **same** workload with zero errors.

## Summary

| Benchmark                                   |    tsc 5.7.3 |                  tsgo (TS7 beta) |   Δ wall | Speedup |
| ------------------------------------------- | -----------: | -------------------------------: | -------: | ------: |
| `build:all` (full Turbo graph, 45 tasks)    | **136.87 s** | **102.13 s** _(45/45 succeeded)_ | −34.74 s |   1.34× |
| `tsc --build` types-only (all project refs) | **154.73 s** |                      **84.81 s** | −69.92 s |   1.82× |

| Benchmark   | tsc user time | tsgo user time | tsc peak RSS | tsgo peak RSS |
| ----------- | ------------: | -------------: | -----------: | ------------: |
| `build:all` |      299.72 s |       233.51 s |      4.63 GB |       3.42 GB |
| types-only  |      181.07 s |       135.83 s |      4.67 GB |       4.29 GB |

## Observations

- **Types-only (apples-to-apples)**: tsgo completed the same workload in **55%** of tsc's wall time (1.82× speedup). Peak memory was ~8% lower. This is the cleanest signal — both compilers did identical work across the project-reference graph.
- **`build:all`**: 1.34× wall-clock speedup. Slower than the types-only ratio because each package's `build` = `build:types` (tsc) + `build:swc` (SWC) + misc; SWC and IO are unchanged, and Turbo's across-package parallelism dilutes the per-task tsc win.
- **Memory**: tsgo's RSS for `build:all` was ~26% lower (4.63 GB → 3.42 GB), meaningful on CI runners with tight memory budgets.

## TS7-exposed issues (now fixed)

These were the real problems TS 7 surfaced on this repo, and what was required to unblock the benchmark:

### Config (`TS5102`)

- **`tsconfig.json` (root)** — removed `baseUrl`. All per-package tsconfigs inherit via `extends`, so this single change resolved TS5102 across the monorepo.

### Stricter type checks (`TS2320` / `TS2430`)

- **`BaseDatabaseAdapter.sessions`** (`packages/payload/src/database/types.ts`) and **`DrizzleAdapter.sessions`** (`packages/drizzle/src/types.ts`) were declared with incompatible narrow shapes. Widened both to `Record<number | string, any>` so adapter implementations (`ClientSession` for mongodb, Drizzle session for pg/sqlite) are assignable.
- **`DrizzleAdapter`** extension conflicts with per-adapter `Args` — added `extensions`, `readReplicasAfterWriteInterval`, `transactionOptions` to the `Omit<Args, ...>` lists in `packages/db-postgres` and `packages/db-vercel-postgres`.
- **`idType` narrowing** — `idType: Args['idType']` changed to `NonNullable<Args['idType']>` in the three pg/sqlite adapters; `DrizzleAdapter.idType` widened to include `'number'` so sqlite-family adapters can extend it.
- **`packages/db-mongodb/src/transactions/beginTransaction.ts`** — removed now-unnecessary `@ts-expect-error` (its error went away once the base type was widened).
- **`packages/plugin-mcp`** — `declare module 'payload'` had augmented `PayloadRequest.payloadAPI` with `'MCP'`, conflicting with the core type. Removed the augmentation; the runtime value is cast at assignment. A proper fix belongs in core (widening `CustomPayloadRequestProperties.payloadAPI`) but was out of scope here.

### Module resolution (`TS2307`)

TS 7 is stricter about subpath imports that aren't exposed via a package's `exports` field:

- **`packages/ui`** — imports from `@dnd-kit/core/dist/hooks/utilities` replaced with `DraggableSyntheticListeners` from the public entry `@dnd-kit/core`.
- **`packages/email-nodemailer`** — `SMTPConnection.Options` from `nodemailer/lib/smtp-connection` replaced with `Parameters<typeof nodemailer.createTransport>[0]` (same shape, public entry).
- **`packages/storage-r2`** — `R2Range` from `@cloudflare/workers-types/2023-07-01` (package has no `exports` field) inlined as a small literal type.

Every fix also still compiles cleanly under `tsc` 5.7.3 — no forks needed.

## Caveats

- Single run per configuration; no variance estimate. `build:all` includes non-TS steps (SWC, esbuild, copyfiles) whose times are noise against the tsc vs tsgo delta.
- TS 7 beta has no stable compiler API until 7.1 — `typescript-eslint`, `@payloadcms/typescript-plugin` (own TS compiler plugin), `tstyche`, Next.js in-editor integration, etc. will not run on TS 7 today.
- Our `tsconfig.base.json` is already TS-7-friendly (`NodeNext`, `strict`, `ES2022`); the only per-repo migration cost was the ~10 source files touched above.

## Recommendation

**Don't flip the default to TS 7 yet.** Revisit after TS 7.1 (stable compiler API) ships and the ecosystem catches up. But the numbers are compelling:

- **~1.8× faster type emission** on the full project graph.
- **~1.3× faster full monorepo build** (bounded by SWC + IO).
- **~26% less peak RSS** during `build:all`.

For this repo, that's ~35 s off a cold `build:all` and ~70 s off a cold `tsc --build`. Worth keeping an eye on and re-running against 7.0 final / 7.1.

The fixes in this branch are low-risk cleanups that also sharpen the current tsc 5.7.3 types — worth landing regardless of the TS 7 timeline:

1. Widen `BaseDatabaseAdapter.sessions` + `DrizzleAdapter.sessions`.
2. Align per-adapter `DatabaseAdapter` `Omit` lists with `DrizzleAdapter`'s own declarations.
3. Replace deep subpath imports with public exports.
4. Remove `baseUrl` from the root `tsconfig.json`.

## Raw data

- `bench/baseline-build-all.txt`
- `bench/baseline-types-only.txt`
- `bench/tsgo-types-only.txt`
- `bench/tsgo-build-all.txt`

## Reproduce

```sh
bash bench/run-baseline-build-all.sh
bash bench/run-baseline-types-only.sh
pnpm add -Dw @typescript/native-preview@beta
bash bench/run-tsgo-types-only.sh
bash bench/run-tsgo-build-all.sh
```
