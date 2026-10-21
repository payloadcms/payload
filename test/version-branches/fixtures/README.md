Written with AI

# Drafts source fixtures

These are SQLite database exports produced by the published npm packages, not records invented to resemble an older schema. `released-v3.91.0` is the stable Payload 3.91.0 generation (scalar `_status`); `current-v4.0.0-beta.3` is the published prerelease matching the current source generation (localized `_status`). Both use the matching official SQLite adapter. `provenance.json` records the package tarball URLs, npm integrity values, and SHA-256 hashes of the exported schema and data.

`schema.sql` contains SQLite's actual `sqlite_master` DDL. `data.json` contains raw content/version/job tables, including locale tables and nested row relations, plus live and working API views observed under that package. Auth tables have their schema included but contain no exported accounts, credentials, or sessions. Content IDs, array row IDs, and the clock are deterministic. The cases include a published bilingual document with divergent shared and localized working content, a repeated autosave, an incomplete unpublished identity, a global with divergent working content, and pending collection publication/global withdrawal jobs. Pending jobs have no actor and explicitly retain the legacy trusted-system behavior; actor denial and typed-actor behavior are characterized separately in the current integration suite.

To reproduce each fixture on Node 24.15.0 or later, run from the repository root. Install into a fresh temporary directory outside this monorepo so workspace aliases cannot resolve to current source:

```sh
release_root=$(mktemp -d /private/tmp/payload-drafts-source.XXXXXX)
npm install --prefix "$release_root" --ignore-scripts --no-audit --no-fund --save-exact payload@3.91.0 @payloadcms/db-sqlite@3.91.0
node test/version-branches/fixtures/generate.mjs "$release_root" /private/tmp/reproduced-v3.91.0 3.91.0
```

Repeat with `payload@4.0.0-beta.3`, `@payloadcms/db-sqlite@4.0.0-beta.3`, output `/private/tmp/reproduced-v4.0.0-beta.3`, and final argument `4.0.0-beta.3`. The generator recreates only its own `released-fixture.db` in the supplied isolated directory. Keep the temporary install's generated package lock when investigating differences in transitive dependency resolution. The committed package provenance pins the two packages that own the schema/runtime; it does not promise every future transitive install produces identical bytes.

Run `pnpm exec vitest run --project unit test/version-branches/released-fixtures.unit.spec.ts` to validate provenance hashes, replay both actual SQL schemas and raw rows in an isolated in-memory SQLite database, check foreign keys/history/pending jobs, and verify the observed scalar/localized status difference. The generator uses released packages only; the replay test does not initialize current Payload over old data or imply that upgrade has completed.

This baseline establishes two concrete source generations. It does not establish support for every historical Payload release, released MongoDB/PostgreSQL physical schemas, or any adapter wrapper. M9 must add adapter-specific exports and run the full source-schema/status migration, branch-head backfill, pending-job conversion, verification, interrupted retry, cutover, and rollback against the agreed supported release range. Existing history IDs and exact pending job inputs are retained for that rehearsal. No data from the unreleased content-branching PR is included.
