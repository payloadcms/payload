# File Transform State — newer foundation

The feature was recreated on `feat/file-transform-state-core` from `feat/file-versioning-core` at `202c62eb874d747e9cf77ad068ff0bda6f1f0fa7`, verified against the matching remote branch. The original `feat/file-transform-state` branch is preserved. Only its two feature commits were transferred; the older foundation's history was not imported.

## Adaptation

The new foundation derives stored-file ownership from server-owned representation descriptors instead of the removed private manifest. Transform-state default/variant reuse, semantic restore, request-only defaults and generated fixtures now use that model. Logical outputs with no physical object key or stable byte length do not enter stored-file cleanup.

The port preserves collection-specific Sharp bridge selection, disk-backed upload sources, per-stage response cancellation, historical cleanup guards and the newer foundation's test corrections. The original/current source contract, stage-owned options, saved-key coverage and open transform definitions remain intact.

The broad Mongo run found a restore regression: the nested replay plan considered a selected version's historical default an outgoing current object and re-archived it. Restricting that nested plan to the copied original and newly generated representations fixed the regression. The outer restore remains responsible for current-file archival. The existing selected-version invariance regression failed before the correction and passed afterward.

Dependencies were installed from the new foundation's frozen lockfile. TypeScript, GraphQL and SQLite fixtures were regenerated, removing the obsolete manifest/revision fields and retaining nullable transform JSON and generated custom definitions.

## Verification

- New foundation before the port: 45 unit files, 453 tests passed.
- Recreated feature: 56 unit files, 528 tests passed.
- Generated/transformer types: 12 tests, 18 assertions passed.
- Core, Sharp and UI TypeScript checks passed.
- Changed-source lint: zero errors; 200 warnings, including existing e2e warnings and ignored generated/unit files.
- Focused restore fix: 76 integration tests passed, one skipped.

| Final regression run                                                                               | Result                          |
| -------------------------------------------------------------------------------------------------- | ------------------------------- |
| MongoDB: transform state, file versioning, upload transformers, uploads and related storage suites | 11 files, 314 passed, 1 skipped |
| Postgres: transform state, file versioning, upload transformers                                    | 5 files, 110 passed, 5 skipped  |
| SQLite: transform state, file versioning, upload transformers                                      | 5 files, 110 passed, 5 skipped  |
| Chromium crop/focal editor regressions                                                             | 3 passed                        |

Database runs were sequential. Editor tests used their own server on port 3018; the runner reported suite success and then stopped its child server. Keyboard focal movement/clamping (2.1.1), numeric alternatives to dragging (2.5.7), validation feedback and labels (3.3.1–3.3.3), accessible control names/values (4.1.2) and axe checks were reverified. The broader WCAG 2.2 A/AA assessment and outstanding manual/assistive-technology checks remain documented in the original verification report; this migration adds no conformance claim.

## Scope

This migration does not close the previously identified audit items. Optional-schema validation/JSDoc requirements, contract reconciliation, MCP verification, manual accessibility verification, legacy rollout and atomicity follow-ups retain their prior status. Full file localization remains deferred by agreement. No merge or replacement of the original remote branch is included.
