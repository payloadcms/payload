Written with AI

# Architecture follow-up: retire manifest-based read predicates

Status: proposed architecture task. This PR removes the public and sanitized `maxShadowedIDs` setting and its warning only; it preserves existing fallback filtering. The requirements below are not a newly implemented adapter interface.

## Problem and scope

The fallback `resolveBranchQuery` loads branch-change identities into request memory and constructs `in`/`not_in` predicates. Its synchronous counterpart reads cached manifests. Query size and application memory can therefore grow with branch size.

Official MongoDB and Drizzle adapters already implement database-native branch visibility for normal active-branch collection reads. MongoDB uses lookup stages; Drizzle uses correlated existence predicates against `payload-branch-changes`. Removing the config setting does not require external adapters to adopt these strategies immediately.

Retiring the fallback is a separate task. It must replace every read-predicate dependency, preserve branch semantics, and establish a supported integration contract for independent adapters.

## Important audit findings

- Core branch deletion calls `resolveBranchQuery` to resolve a target and then performs a raw `findOne` with `branch: false`. Consequently the fallback is not exclusively for external adapters.
- `getBranchPredicateSync` remains involved in join/query builders, including main-only paths. Removing it mechanically can remove required main filtering.
- Shared collection draft/version-history fallback helpers also build predicates from change records. Version history includes fork-boundary behavior and is not interchangeable with current-document visibility.
- Manifest loading has non-read responsibilities: first-copy bookkeeping, operation lookup, physical-ID caches, and deletion handling. Do not delete these just because normal read filtering becomes database-native.
- No native-visibility capability flag or callback currently exists on `BaseDatabaseAdapter`. Existing official implementations are adapter-specific query code.

## Required semantics

For an eligible collection and active branch B:

```text
visible current documents =
  main rows without a matching branch change
  plus B-owned rows without a matching delete change
```

Match change records by branch, collection, and canonical document identity. Deletion intent comes from the authoritative change record. Preserve user/access predicates and hide unrelated branches. Main-only queries must remain main-only; raw bypass must remain raw.

Visibility must be applied before ordering, pagination, counts, distinct aggregation, and relationship traversal. Filtering returned pages in application code is not an equivalent implementation.

For collection version history, preserve branch-owned history and the permitted inherited main history through the stored fork boundary. Draft reads need their own latest-state/deletion rules. Globals have separate singleton and version-stream semantics.

## Core implementation work

1. Inventory direct and indirect callers of `resolveBranchQuery`, `getBranchPredicateSync`, `appendBranchFilter`, and manifest-backed draft/history predicates. Classify main-only filters, active-branch visibility, and bookkeeping separately.
2. Define a supported adapter integration boundary. Decide whether native visibility is an explicit capability or an unconditional branching requirement, and how unsupported adapters fail clearly. Do not silently return unfiltered data.
3. Refactor branch-delete target lookup so it delegates branch-aware resolution without recursively invoking tombstoning or mixing projected IDs with raw physical writes.
4. Route joins, relationship filters, distinct queries, and version reads/counts through equivalent visibility implementations, including synchronous builders and aliases.
5. Retain the main-only and bypass contracts wherever old helpers are removed.
6. Remove manifest-backed read helpers/exports only after all consumers are migrated and public API support boundaries are decided.
7. Keep manifest-based bookkeeping until a separate audit proves it unnecessary.

## Explicit external-adapter requirements

- Support branch state from method arguments and request context, including raw bypass and excluded entities.
- Implement equivalent visibility in `find`, `findOne`, `count`, and `findDistinct` before result shaping.
- Apply visibility to each related collection inside relationship predicates, joins, populated reads, and relationship sorting/distinct extraction.
- Implement branch-aware draft reads, collection history/list/count, logical parent projection, and fork-boundary rules.
- Preserve global read-through and branch-scoped global versions/counts; these do not require an expanding collection manifest.
- Keep physical/logical identity translation, writes, deletion, copy, and transaction semantics consistent with the new read engine.
- Use suitable lookup/index/query primitives for the backend. A backend without joins must demonstrate equivalent correctness and bounded query construction; a database-specific query syntax is not mandated.
- Publish limitations and capability behavior. Do not advertise branching support based on ordinary `find` alone.

The complete onboarding plan is in [EXTERNAL_DB_ADAPTER_BRANCHING_IMPLEMENTATION_PLAN.md](EXTERNAL_DB_ADAPTER_BRANCHING_IMPLEMENTATION_PLAN.md).

## Verification and completion criteria

- Equivalent results for inherited, changed, created, deleted, trashed, drafted, and localized content across main, two branches, and bypass reads.
- Correct counts, ordering, pages, distinct identities, nested relationship filters, joins, and join counts.
- Correct version-history boundaries and branch draft behavior, including deletion masking.
- Correct branch delete target selection and raw physical write targeting after helper removal.
- Read queries do not load an entire branch manifest or construct predicates proportional to its total change count. Check query traces as well as timings.
- Benchmarks cover large branches, selective queries, indexes, and transaction/session behavior on each backend.
- First-copy, merge, discard, rollback, and cleanup tests continue passing; read-path retirement must not remove their bookkeeping.
- Independent adapters have a documented migration path and observable support/failure behavior before shared fallbacks are removed.

## Starting points

- `packages/payload/src/branching/resolveBranchQuery.ts`
- `packages/payload/src/branching/tombstone.ts`
- `packages/payload/src/branching/versions.ts`
- `packages/payload/src/branching/resolveBranch.ts`
- `packages/drizzle/src/queries/buildBranchVisibility.ts`
- `packages/db-mongodb/src/queries/buildBranchVisibility.ts`
- Adapter join/relationship query builders and distinct queries.
- `test/branching/db-isolation.int.spec.ts` and `test/branching/perf.int.spec.ts`.
