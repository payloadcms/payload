# Version selector repair results

Implemented the eight approved fixes sequentially. A fresh independent reviewer then reproduced five additional defects; all five were fixed in one pass with durable failing-then-passing regressions. No second review was performed. The independent review's original verdict was Request changes; this handoff records the subsequent fixes and evidence, not independent approval of the final candidate or the entire breaking change.

No commits, pushes, branches, or PRs were created. HEAD remains `e6cd442f40563b2dd95cebcc6a3ffaa2dbbc68f2`. Repair snapshots and the ledger are retained for recovery.

| Original finding           | Final behavior                                                                                                                                                                        | Regression evidence                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Upload loss             | Cleanup follows successful validation, persistence and hooks; live/active references survive denied or rewritten publication. Unreferenced replacements are removed.                  | [uploads.int.spec.ts](/Users/nlentz/.codex/worktrees/2e39/payload-core/test/version-selector/uploads.int.spec.ts): 9 passing tests                                                                                |
| 2. Mixed latest writes     | Locale-specific pending/live destinations preserve shared pending fields; live publication validates pending content, including hook-driven transitions.                              | [mixed-latest.int.spec.ts](/Users/nlentz/.codex/worktrees/2e39/payload-core/test/version-selector/mixed-latest.int.spec.ts): 23 passing tests; collection/global rollback checks with SQLite transactions enabled |
| 3. Global population       | Relationships use the exact requested selector and retain access checks.                                                                                                              | [globals.int.spec.ts](/Users/nlentz/.codex/worktrees/2e39/payload-core/test/version-selector/globals.int.spec.ts): 20 passing tests                                                                               |
| 4. Import locale failures  | New draft/published imports write supplied locales; later failures count as row failures and subsequent rows continue. Existing-row scalar publication reaches every supplied locale. | [imports.int.spec.ts](/Users/nlentz/.codex/worktrees/2e39/payload-core/test/version-selector/imports.int.spec.ts): 14 passing tests                                                                               |
| 5. Import matching         | Matching searches latest content, including draft-only and changed pending keys, with authenticated access enforced.                                                                  | [imports.int.spec.ts](/Users/nlentz/.codex/worktrees/2e39/payload-core/test/version-selector/imports.int.spec.ts): 14 passing tests                                                                               |
| 6. GraphQL create metadata | Core tags the final returned object with its effective selector; nested hook creates cannot overwrite the parent selector.                                                            | [api.int.spec.ts](/Users/nlentz/.codex/worktrees/2e39/payload-core/test/version-selector/api.int.spec.ts): 18 passing tests                                                                                       |
| 7. GraphQL projections     | Companion fields map to stored fields; whole-field inclusion dominates partial selections in either order, including aliases, fragments and nested groups.                            | [api.int.spec.ts](/Users/nlentz/.codex/worktrees/2e39/payload-core/test/version-selector/api.int.spec.ts): 18 passing tests; schema units 4 passing                                                               |
| 8. Locale copy             | Draft capability is checked for collection/global targets; copied publication state is removed; no-drafts entities copy normally with access enforced.                                | [copy-locale.int.spec.ts](/Users/nlentz/.codex/worktrees/2e39/payload-core/test/version-selector/copy-locale.int.spec.ts): 5 passing tests; Chromium 4 passing scenarios                                          |

The five final-review findings were denied-publication upload deletion, mixed publication validation, nested-create selector contamination, order-dependent companion projection, and existing-row import publication. Each has a durable RED→GREEN regression. The rich-text validation case is an additional boundary control using the editor's existing aggregate validator.

## Final verification

| Check              | Command/evidence                                                                                                                                 | Result                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Integration        | `pnpm test:int:sqlite --run test/version-selector test/versions`                                                                                 | 264 tests passed, 13 files                                                                |
| Units              | Vitest unit project: upload references, localized writes, localized GraphQL types, selector parser, SDK query parameters, localized UI form data | 32 tests passed, 6 files                                                                  |
| Public types       | `pnpm test:types test/types/types.spec.ts`                                                                                                       | 159 tests, 264 assertions passed; 226 assertions ignored by existing configuration        |
| Package types      | `pnpm exec tsc --noEmit -p <package>/tsconfig.json` for payload, graphql, ui, plugin-import-export                                               | All passed                                                                                |
| Browser            | Chromium copy-to-locale success, persistence and denied-copy scenarios, using the SQLite-backed a11y fixture                                     | 4/4 passed                                                                                |
| Style              | Targeted ESLint, Prettier, `git diff --check`                                                                                                    | Zero lint errors; existing/ignored-file warnings; formatting and whitespace checks passed |
| Generated fixtures | `PAYLOAD_DATABASE=sqlite pnpm dev:generate-types version-selector` and `a11y`                                                                    | Generated types inspected and retained                                                    |

Required declaration dependencies were built locally for type checks. The temporary browser server/database were cleaned up, and its generated tsconfig alias was restored to the original community config.

## Remaining verification and behavior limits

- Configured MongoDB (27018) and PostgreSQL (5433) refuse connections; those adapters remain unverified. SQLite transaction tests do not prove cross-adapter atomicity.
- The full existing import-export suite cannot initialize because LocalStack on localhost:4566 is unavailable. Its setup failures are not counted as passing or classified as new assertion regressions. Real batch-processor controls passed.
- No production build or cloud upload adapter run was performed.
- Original localized GraphQL array fields keep their list schema. Under `locale: all`, use their `_locales` companions; selecting the normal array field can still produce an iterable error. This existing schema behavior is outside the projection-union fix and needs a separate API decision if normal-field compatibility is required.
- Historical binary retention and generalized filesystem transactions were excluded by the approved plan. Live/active references are protected; historical restore or commit/filesystem failures remain outside the guarantee.
- These repairs do not establish release readiness of the complete original breaking implementation.

## Accessibility evidence

Assessed the actual copy drawer for successful and denied keyboard interactions, accessible naming/control state, persisted destination data, error visibility/live-region markup, and denied-state focus retention. Browser checks cover the production server action and UI.

Potentially affected WCAG 2.2 Level A and AA criteria assessed: 1.3.1; 2.1.1/2.1.2; 2.4.3/2.4.6/2.4.7/2.4.11; 2.5.2/2.5.3; 3.2.1/3.2.2; 3.3.1–3.3.3; 4.1.2/4.1.3. The four passing Chromium scenarios substantiate combobox naming, keyboard selection/submission, successful no-drafts persistence, and denied-copy error visibility/polite live markup/focus retention. They do not establish natural tab order or criterion-wide conformance.

Manual or suitable assistive-technology verification remains for successful-copy focus restoration, natural focus order/escape, visible/unobscured focus, screen-reader speech and notification timing. No product or criterion conformance claim is made.

## Decision record

The following is the complete chronological ledger of rulings, including superseded decisions:

- Ruling: Preserve ledger and snapshots until handoff because no commits are allowed; commit-based skill scripts cannot track this run.

- Task 2: Ruling: omit unused selectedDoc helper parameter; targetsByLocale plus authorized result already carry its needed state. Added skipValidationByLocale internally to keep live-locale validation active. Missing starting locales select draft rather than live.

- Task 2: Ruling: SQLite fixture adapter disables transactions by default, so cross-copy rollback is not asserted there; transaction-enabled adapters remain pending, as does MongoDB. Docker daemon is absent.

- Task 3: Ruling: unpopulated Local API relationships retain IDs by existing contract, so tests assert child ID rather than GraphQL-style null. Denied read also preserves ID without exposing content.

- Task 4: Ruling: follow-up creation locales use draft for a draft target, latest plus explicit published status for a published target; a newly created French locale has no published copy yet, so published selector cannot address it. Only drafts-enabled entities receive publication state.

- Task 6: Ruling: GraphQL mutations execute serially; concurrent isolation is tested with query roots, plus serial create aliases. Core communicates its final selector after beforeOperation via isolated req.query, matching the approved plan.

- Task 8: Ruling: also repair globals.config lookup and discard copied root \_status, because new integration controls exposed a TypeError and unwanted live publication in the same action. Authenticated user/access denial is exercised against real operations rather than mirrored unit mocks. Browser evidence pending.

- Task 8: Ruling: migrate the a11y seed's five legacy draft arguments to version selectors because the browser fixture could not initialize under the breaking API. Publish the first never-published draft using version:draft with \_status:published. Cost if wrong: fixture state would not match published/draft browser scenarios.

- Task 2: Ruling: enable the existing SQLite transaction implementation only in two failure tests, restoring adapter methods afterward; both copies roll back on version persistence failure. This supersedes the earlier SQLite rollback gap, while MongoDB/PostgreSQL remain unavailable. Cost if wrong: those adapters may still differ in atomicity.

- Final: Ruling: full existing import-export suite cannot initialize because LocalStack is unavailable (ECONNREFUSED localhost:4566 even with network permission). Report this limit and use real batch-processor integration controls; do not start/install infrastructure. Cost if wrong: storage/plugin combinations may hide regressions.

- Final: Ruling: keep dedicated publish/unpublish APIs deferred per approved spec/plan — no requested endpoint behavior was omitted — cost if wrong: a later API proposal would need a separate implementation.

- Final: Ruling: historical binary retention/generalized transactional filesystem redesign remain outside this repair; protect live/active copies and delay cleanup until validation, persistence and hooks succeed — cost if wrong: historical restores or commit/filesystem failures may still lose files.

- Final: Ruling: final review covers repairs and necessary surrounding flows, not release readiness of the entire original breaking implementation — cost if wrong: unrelated original changes may contain defects.

- Final: Ruling: queue otherwise-skipped draft validators only for latest/all, run them after final publication hooks when that locale becomes published, and preserve condition/submitted-field exemptions — avoids running hooks twice — cost if wrong: custom validators that depend on pre-transform values may differ on hook-driven publication.

- Final: Ruling: replace mutable req.query metadata with the existing returned-object WeakMap moved into core and explicitly re-exported internally; core tags the final result after hooks, GraphQL shares that map — nested operations cannot overwrite another object's selector — cost if wrong: integrations loading multiple Payload copies could create separate metadata maps.

- Final: Ruling: combined projection regression exercises original group fields and nested structured companions; original localized arrays keep a list schema and cannot accept a locale map as an iterable, so their locale-all data is asserted via companions only — cost if wrong: selecting a normal localized array under locale:all may still return a GraphQL error. This remains an original schema behavior, outside the projection-union repair.

## Artifacts

- [Independent review](/Users/nlentz/.codex/worktrees/2e39/payload-core/.superpowers/sdd/2026-10-04-version-selector-review-fixes/final-review.md)
- [Execution ledger](/Users/nlentz/.codex/worktrees/2e39/payload-core/.superpowers/sdd/2026-10-04-version-selector-review-fixes/progress.md)
- [Final repair delta](/Users/nlentz/.codex/worktrees/2e39/payload-core/.superpowers/sdd/2026-10-04-version-selector-review-fixes/repair.patch)
- [Approved plan](/Users/nlentz/.codex/worktrees/2e39/payload-core/docs/superpowers/plans/2026-10-04-version-selector-review-fixes.md)
