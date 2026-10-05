# File Transform State — delivery and verification

Implemented on `feat/file-transform-state`, based on `feat/file-versioning` at `94d55c5ccd15f3de989ba3b2f83bca5644a0f693`.

## Delivered

- Nullable, API-visible `_transforms`: standard built-in types and validation, arbitrary additional JSON keys, omission/preservation, complete replacement, and null/reset semantics.
- Lazy, bounded original/current file sources; mutable full documents and frozen entry snapshots; stage-owned options; exact saved-key coverage before effects; MIME routing rechecked after conversion.
- Canonical writes through collection and field hooks before processing, final state and changed-field validation, retained-original replay, semantic version restore and duplication through existing managed-file ownership/compensation.
- Saved-default request execution before ephemeral overrides, original delivery, stored-role reuse, request-only logical variants without stored derivatives, and response cancellation on failure.
- Sharp orientation/crop/flip/rotation/resize/focal/metadata/encoding handling, including configured stored and dynamic variants. Core orders transformer stages; Sharp defines its own internal operation order.
- Crop/focal editor initialization, exact saved pixel preservation, numeric alternatives, coordinate errors, custom-key preservation, replacement-file resets, and ordinary JSON form submission.
- Generated TypeScript, GraphQL and SQLite schema fixtures; transformer/upload documentation and migration guidance. The Google Doc table note reflects the approved open-key rule.

## Verification

| Check                                                                                              | Result                                       |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Upload/core, Sharp, editor coordinate units                                                        | 54 files, 528 passed                         |
| MongoDB: transform state, file versioning, upload transformers, uploads and related storage suites | 11 files, 315 passed, 1 skipped              |
| Postgres: transform state, file versioning, upload transformers                                    | 5 files, 115 passed, 3 skipped               |
| SQLite: transform state, file versioning, upload transformers                                      | 5 files, 113 passed, 5 skipped               |
| Generated and transformer type assertions                                                          | 10 tests, 15 assertions passed               |
| Core TypeScript build; Sharp and UI TypeScript checks                                              | Passed                                       |
| Changed-source ESLint                                                                              | 0 errors; 31 warnings in the broad selection |
| Editor Chromium accessibility regressions                                                          | 3 passed                                     |

The final dynamic variant metadata/encoding regression failed before the fix and passed afterward. The full 528-unit selection and Sharp typecheck were rerun after it; the focused transform-state integration suite passed all 27 tests afterward. The required pre-commit check exposed two existing conditional assertions in the upload-transformer fixture. Making the shared-original invariant unconditional retained coverage and satisfied lint; all 35 upload-transformer tests passed again. Cross-database suites ran sequentially to avoid shared test-config races.

## Fresh review and fixes

One fresh reviewer found five Important issues, no Critical findings and no deferred Minor findings. Each was reproduced with a failing regression and corrected in one fix pass:

1. Nested transformer mutations could alias the validation baseline. Deeply detached snapshots now preserve comparison and final validation.
2. Configured final image processing could discard canonical metadata/encoding. Saved policy now reaches the final stored main/variant and dynamic variant encoding boundary.
3. Initial built-in encoding validation could use an unverified incoming MIME. Input preparation detects the authoritative image MIME first.
4. Duplication could fetch its retained source before discovering a missing executor. Coverage now precedes source retrieval.
5. Retained-original replay could eagerly buffer an unbounded source. Local/provider sources are lazy, and Sharp enforces its declared whole-read bound before consuming them.

A subsequent focal-coordinate regression also verifies mapping through a saved cover resize before a downstream variant or query resize.

## Accessibility evidence and remaining manual verification

The changed editor flow was assessed against WCAG 2.2 A/AA criteria 1.1.1, 1.3.1, 1.4.3, 1.4.4, 1.4.10, 1.4.11, 1.4.12, 2.1.1, 2.1.2, 2.4.3, 2.4.6, 2.4.7, 2.4.11, 2.5.2, 2.5.3, 2.5.7, 2.5.8, 3.2.2, 3.3.1, 3.3.2, 3.3.3, 4.1.2 and 4.1.3.

Automated evidence covers keyboard focal movement/clamping, named controls, numeric alternatives to dragging, integer/fraction/zero inputs, invalid-value identification and `aria-invalid`, disabled Apply while invalid, corrected save/reopen, and axe checks. Axe found the Apply contrast failure; using the existing secondary button fixed it. Personally inspected screenshots at 1280px and 320px show the preview and controls stacking with complete labels and visible Apply/Cancel, without horizontal clipping.

This is not a full conformance assessment. Assistive-technology announcements, complete native keyboard/focus return and trap behavior, focus obscuring, 200% zoom, user text spacing, non-text contrast, pointer cancellation and target sizing still need manual verification. Existing native controls, modal and preview semantics are reused. No client/server import boundary changed; no new visual baselines or production bundling claim were introduced. The existing a11y fixture provides the editor e2e coverage instead of a duplicate fixture.

## Delivery boundaries

Full file-bundle localization remains the agreed follow-up once that foundation exists. Existing field-level localized URL envelopes remain compatible. Recording video/PDF adapters verify the portable contract; actual video transcoding and PDF rendering are separate adapter packages. Duration/page-count source bounds belong to those adapters until an extractor contract exists.

Legacy focal reads remain temporarily available for migration; canonical writes clear obsolete state, and legacy query writes are retired. Historical columns require a later backfill/drop migration. SQLite retains its foundation's nontransactional behavior: failures after durable updates in after-write hooks do not promise universal rollback. Transaction-backed compensation and file-operation regressions are covered.

MCP-specific JSON parity was not claimed without an applicable harness. Manual accessibility work and localization are explicitly outstanding; the implementation is retained on the local feature branch, without a push or merge.

## Rulings I made

The following is the exhaustive ledger record in chronological order. The early interpretation allowing arbitrary values under built-in keys was superseded by the user's explicit clarification: arbitrary additional keys are allowed, and built-in shapes are validated.

- Ruling: reuse current isolated worktree, creating feat/file-transform-state from latest feat/file-versioning — user confirmed foundation — new upstream changes require verification before migrating contracts.
- Ruling: adapter owns operation order, core owns stage order — confirmed clarification — no universal sequence enforced.
- Ruling: Interpret total freedom as arbitrary JSON values under every key, including conventional keys — consistent with user direction; exported types remain opt-in and core retains object/null write semantics — cost if wrong: tighten only adapter conventions, not persisted container schema. Tasks 2/3/8 revised; original closed-schema spec is superseded.
- Source temp-file unit expectation changed from document.pdf to document-original.pdf: unchanged foundation naming helper reserves original suffix. Ruling: preserve foundation naming and align stale test assertion — wrong cost: one fixture expectation correction.
- Ruling: retire legacy query crop/focal writes rather than maintain a second editorial authority — explicit breaking migration in spec; legacy file-versioning tests now use canonical body state and expect variants to follow effective crop — old clients must change writes.
- Ruling: keep legacy focal columns/API reads temporarily but deny client create/update writes and clear on canonical saves — historical data needs readable backfill; dropping columns is a documented follow-up — wrong cost: obsolete read-only fields remain until migration.
- Ruling: a managed default role can share the original object, and a requested variant requires its size role — explicit server-owned role proves materialization; request-only creation strips default roles — wrong cost: private manifest corruption could falsely prove reuse. No-query count is no longer used as an original bypass.
- Ruling: adapters own duration/page-count applicability checks until a metadata extractor contract exists — current foundation has no standard duration/page-count fields; do not invent competing metadata fields — wrong cost: each media adapter must enforce these checks.
- Ruling: use one coherent implementation commit because source contract/state planning/lifecycle changes now depend on each other — user refinement made independent intermediate commits uncompilable — wrong cost: larger review range.
- Ruling: variant filenames may change after a canonical focal edit or semantic restore — current processing regenerates representations and retains historical owned files — wrong cost: consumers relying on identical derivative filenames must follow returned metadata.
- Ruling: preserve custom localized URL field envelopes while file localization is deferred — pre-existing foundation allows field-level localization and post-hook metadata must still match its schema — wrong cost: this compatibility is narrower than full localized file bundles.

The reviewer set aside full file localization, concrete video/PDF engines and unrelated pre-existing workspace instructions/config mapping. These remain outside this delivery for the reasons above; the cost is a separate localization integration, adapter-specific media validation, and preserving the user's local workspace edits.

## Deferred minors

None reported by the fresh reviewer.
