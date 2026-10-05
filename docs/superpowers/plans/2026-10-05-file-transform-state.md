# File Transform State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist portable editorial transform intent on uploads and resolve their default representation reversibly from the retained original.

**Architecture:** Add one nullable JSON upload field, with built-in definitions and arbitrary additional keys. Validate explicit replacements before processing, execute against a working document and retained source, and commit through the existing managed-file transaction/compensation mechanism. Dynamic delivery runs saved defaults before ephemeral request overrides and never saves its working document.

**Tech Stack:** Payload TypeScript, existing JSON Schema/type-generation machinery, REST/GraphQL/Local API, transformer-sharp, MongoDB and Drizzle SQL adapters, Vitest and Playwright.

**Spec:** [Local source snapshot](./2026-10-05-file-transform-state-spec.md); [live File transform state tab](https://docs.google.com/document/d/1xHewFTv-JG0zDuTTUZ9BE-fatF6NH9DDVoa9WGjquYc/edit?tab=t.mjtte4xqo24o#heading=h.ce623t2w0mjz).

## Delivery status — October 5, 2026

Tasks 1–8 are implemented within the revised, authorized scope. See the [verification and decisions](./2026-10-05-file-transform-state-verification.md) for actual results and boundaries. The original step checklist below is retained as the planning outline; validation evidence in the delivery report supersedes its proposed commands. Interdependent foundation/state changes are delivered in one coherent commit. Full file localization is deferred by agreement; manual accessibility verification remains outstanding. Existing a11y fixtures cover the editor instead of adding a duplicate e2e fixture. No production bundling test was required because client/server imports did not change.

## In-flight design revision: open transform state

The user changed the design during execution: ship the conventional transform shapes as out-of-the-box types, while giving `_transforms` total freedom. This supersedes the original spec’s closed-key schema: built-in keys keep standard shapes and validation, and arbitrary additional keys are permitted without registration. Export built-in types as reusable building blocks.

User clarification: “Allow arbitrary keys, but validate built-in keys against their standard shapes.” Keep the top-level object-or-null replacement contract. Built-in keys use core validation; custom keys accept arbitrary JSON and adapters own their semantic validation. Task 1’s lazy sources, complete documents, snapshots, and stage-owned options remain applicable.

Tasks 2/3/8 are revised together below: unknown-key rejection, no-index-signature generation, and mandatory custom-definition registration are removed. Built-in shape/semantic validation remains; saved-key coverage still applies independently of schema registration. Preserve replacement/null/omission semantics, retained originals, version behavior, request-local overrides, and file-operation compensation. Transformer-owned validation must still run before its effects and reject failures without committing partial state.

## Global Constraints

- Every upload collection receives `_transforms`, even without a transformer: `type: 'json'`, nullable, `admin.hidden: true`, not field-level `hidden`.
- Schema identifier and file match: `payload://upload-transforms`; root `additionalProperties: true`.
- Built-in keys: `crop`, `focalPoint`, `resize`, `rotate`, `flip`, `clip`, `pageRange`, `posterFrame`, `metadataPolicy`, `encoding`. Additional custom keys need no registration; built-in keys retain their standard shapes.
- Omission preserves; null clears; an object replaces the whole value; an empty object normalizes to null.
- Crop uses non-negative integer original-source pixels, positive width/height, no unit property. Focal point uses percentages from 0 through 100.
- Clip is original-source milliseconds, start inclusive/end exclusive. Page range is 1-based inclusive.
- `_transforms` contains no target MIME, provider/transformer identity, schema version, processing status, cache state, or physical ownership.
- Top-level upload metadata describes the logical default; `original` describes the untouched source; private manifests own stored files.
- `operation` remains `'upload' | 'request'`; request planning adds `purpose: 'persisted-default' | 'request-override'`. Upload planning does not use purpose.
- All per-file callbacks receive full mutable `doc` and immutable pipeline-entry `originalDoc`; options belong to the stage that produced them.
- Dynamic requests never persist document mutations, transform parameters, or response caches.
- Normal collection access applies. User-facing operations pass the authenticated user/request and retain `overrideAccess: false`.
- Integration tests use `test/__helpers/int/vitest.ts` and one root fixture suite; clean up filesystem, environment, and external side effects.
- Follow repository naming, translations, accessibility, and RSC export rules. Implementation was subsequently authorized by the user.

## Review Focus

1. A persisted custom key outlives its executor: reads and unrelated edits preserve it, but replay fails before any source or storage work. Tasks 2, 4, 6.
2. Conversion changes source/default/variant MIME independently: later stages receive the actual accumulator type, not a stale document scalar. Tasks 1, 3, 4.
3. A crop is edited repeatedly, including x/y or focal values of zero: reopening and expansion use the original without rounding drift. Tasks 5, 7.
4. A failure occurs after a derived file was staged: compensation preserves the prior document, intent, original, and retained versions. Tasks 5, 6.
5. A logical default shares a filename with an original, or a locale lacks optional metadata: routing/fallback cannot bypass saved intent or mix file bundles. Tasks 4, 8.

---

## Baseline and dependency gate

The user confirmed `feat/file-versioning` as the foundation. Inspected that local branch at `ae8ed32cb7` on October 5, 2026. The working checkout is detached at `907ce8da52`; inspection used `git show` and did not switch or modify the feature branch. Resolve paths against the current `feat/file-versioning` head before execution.

What already exists on the dependency branch:

| Area                   | Existing implementation                                                                                | Consequence                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Original and ownership | `uploads/fileVersioning/{manifest,archive,restore,cleanup,fileOperationManager}.ts`                    | Extend these mechanisms; do not build a second artifact registry.    |
| Transform lifecycle    | `uploads/transformers/{types,planTransformerPipeline,transformUploadFile,handleDynamicFileRequest}.ts` | Extend the pipeline rather than add another endpoint.                |
| Sharp processing       | `packages/transformer-sharp/src/{prepareLegacyUpload,transformFile,handleRequest}.ts`                  | Replace legacy edit input with canonical intent.                     |
| Editor                 | `Upload`, `EditUpload`, `UploadEditsProvider`                                                          | Original preview already exists; saved crop initialization does not. |
| Tests                  | `test/file-versioning`, `test/upload-transformers`                                                     | Reuse fixtures and add a focused transform-state suite.              |

**Contract alignment in scope:** the updated File Transformers tab specifies `FileSource`, full documents, boolean/object capability results, and stage-owned options. The inspected branch still passes `File`, duplicate scalar metadata, boolean-only capability results, and shared options. Task 1 aligns the confirmed foundation as part of this work; it does not depend on an unidentified upstream branch. Review this as a separate foundation change before building state-specific behavior on it.

**Naming:** the branch uses `variants` and manifest role `size`; the spec's examples use `sizes`. Use `variants` in this implementation and documentation examples. A public naming change is a separate decision.

**Localization — confirmed delivery decision:** implement transform state on `feat/file-versioning` first, then integrate localization when its foundation is available. The inspected branch does not implement the sibling `upload.localized` specification. Task 8's locale integration is deferred to that follow-up; its other type/schema/documentation work remains in the initial delivery. Full per-file locale fallback and duplication remain in the localization project. The follow-up must resolve one complete file bundle using filename as the locale anchor, disable independent fallback for \_transforms and other bundle members, and pass locale-selected documents to transformers. The initial transform-state feature can land without exposing file localization; it must not claim locale acceptance before the follow-up passes.

**Important ordering gap:** create/update currently call `generateFileData` before field and collection validation hooks. A JSON-field validator alone cannot meet “validate before processing.” Task 2 establishes early state validation, and Task 5 moves upload execution after hooks can affect the candidate, with final validation before commit.

## Confirmed decisions and implementation conventions

The user accepted the initial transform shapes and coordinate conventions below, failure/compensation when format conversion makes a later required stage incompatible, and terminal redirects only when all remaining saved transforms and request overrides are satisfied. Shapes may be revised in response to feedback; changes to already persisted shapes require migration or compatibility handling. Supporting implementation conventions below supplement the source specification.

- Publish the accepted initial built-in shapes below. The vocabulary is deliberately small; provider limits belong in semantic validation.
- Core validates built-in shapes plus the JSON container and write semantics. Custom keys need no registration or schema definition; adapters validate their custom values before processing. Export an open type with named built-in properties and an arbitrary-key index signature.
- Keep legacy focal values readable through a private migration path until documents and historical versions are migrated. Reject new client writes to focalX/focalY. Explicit canonical replacements always win, including null; do not secretly merge legacy focal state into a replacement.
- Only treat a managed default as reusable when the saved state is unchanged and a matching manifest entry identifies its stored bytes. A URL alone cannot prove reuse. An edit or semantic version restore requires fresh coverage/planning.
- Exact original crop values must survive reopen/save with no edits. The UI can display percentages, but retain integer pixel state; convert only changed coordinates, clamp the rounded rectangle to source bounds.
- `complete` in the persisted-default phase cannot silently skip outstanding saved keys or requested overrides. A terminal provider redirect is acceptable only when all remaining saved transforms and requested overrides are satisfied. Otherwise require a response that subsequent stages can consume or fail clearly. Pin this confirmed policy with an explicit contract test.
- Resolve the tension between up-front coverage planning and routing after an unpredictable MIME conversion in the foundation contract. Preflight must establish saved-key coverage before effects; execution must recheck each stage against the actual input. If a planned stage becomes incompatible, abort/compensate rather than silently omit its key. Do not call an external provider to discover MIME during planning.

Exported conventional types, with JSDoc describing the following adapter conventions. Built-in keys retain these constraints, while additional keys remain open:

| Key/type                  | Initial fields and constraints                                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `CropTransform`           | Required x/y/width/height; integer x/y >= 0, width/height > 0; known-original bounds.                                                           |
| `FocalPointTransform`     | Required finite x/y, each 0..100; fractions allowed.                                                                                            |
| `ResizeTransform`         | Optional positive integer width/height, at least one required; optional fit = cover/contain/fill/inside/outside and withoutEnlargement boolean. |
| `RotateTransform`         | Required finite angle in degrees; clockwise in the original's displayed orientation; normalized modulo 360.                                     |
| `FlipTransform`           | Optional horizontal/vertical booleans, at least one true.                                                                                       |
| `ClipTransform`           | Required integer startMs >= 0 and endMs > startMs; known-original duration bounds.                                                              |
| `PageRangeTransform`      | Required positive integer startPage/endPage, startPage <= endPage; known-original page count bounds.                                            |
| `PosterFrameTransform`    | Required integer timestampMs >= 0; within known-original duration.                                                                              |
| `MetadataPolicyTransform` | Required mode = preserve/strip; does not modify extracted \_metadata.                                                                           |
| `EncodingTransform`       | Conventional image/video/PDF option branches; no mimeType or compression scalar. Start with the settings listed below.                          |

Initial encoding properties: image quality (integer 1..100), progressive (boolean); video videoCodec/audioCodec/profile (non-empty strings), videoBitrate (positive integer), frameRate (positive finite number); PDF profile (non-empty string), downsampleImagesToDpi (positive integer), linearize/stripMetadata/removeHiddenObjects (booleans). Select compatibility from expected/resolved default MIME, and run provider checks for supported codecs/profiles. Shared property names such as profile do not select a branch by themselves.

Unknown duration/page count does not invent a public metadata column: skip only the unavailable bound, enforce structure and ordering, and let the owning executor enforce its source limits. Unknown result MIME cannot justify executing encoding with an arbitrary branch; require the executor to establish an expected compatible result before effects and validate the actual final MIME afterward.

Coordinates use orientation-normalized original space, with clockwise rotation. Each transformer defines and documents its internal operation order; core controls transformer-stage order and does not enforce a universal image-operation sequence. Respect the definitions' constraints, including original-source crop coordinates and crop preceding resize/encoding. Document the mapping of focal coordinates into a cropped region; do not constrain the saved focal point to the crop. Verify the coordinate convention and Sharp's documented behavior in its tests.

## Task 1: Align the transformer foundation

**Files:** Modify `packages/payload/src/uploads/transformers/{types,planTransformerPipeline,transformUploadFile,handleDynamicFileRequest,uploadTransformerBridge}.ts`, `packages/payload/src/uploads/generateFileData.ts`, `packages/payload/src/index.ts`, `packages/payload/src/exports/internal.ts`, `packages/transformer-sharp/src/{sharpTransformer,transformFile,handleRequest,prepareLegacyUpload}.ts`. Create source adapter/snapshot helpers beside the transformer pipeline if absent. Extend corresponding colocated specs and `test/upload-transformers/{transformerFixtures,int.spec,types.spec}.ts`.

**Interfaces:** Adopt the File Transformers spec's `UploadDocument`, `FileSource`, `CanTransformResult<TOptions>`, and full-document callbacks. `CanTransformResult` accepts false/true or `{ canTransform: true, options?: TOptions }`. A pipeline stage owns `{ transformer, options }`; execution passes only its options. FileSource wrappers support incoming files, temporary files, and durable storage inputs without eager whole-file reads. Settle its exact bounded-read/stream methods in this prerequisite, not independently in state consumers.

- [ ] Add failing tests: two stages have different options and custom fields; stage 2 observes stage 1 doc mutations; nested originalDoc remains identical; PNG -> JPEG reroutes the next stage using File.type; unsupported direct-upload inputs do not trigger an eager download.
- [ ] Run `pnpm exec vitest run --project unit packages/payload/src/uploads/transformers packages/transformer-sharp/src`; record the expected contract failures.
- [ ] Implement the base contract and migrate the private Sharp bridge/call sites. Retain access checks before application callbacks; use deep immutable snapshots, not just TypeScript Readonly.
- [ ] Run the same unit selection, `pnpm run test:int upload-transformers --run`, and `pnpm exec tstyche test/upload-transformers/types.spec.ts`. Expect existing and new tests to pass.
- [ ] Commit as a foundation change independently of state-field work.

## Task 2: Add open transform state and enforce replacement semantics

**Files:** Create `packages/payload/src/uploads/transformState/{types,validateTransformState,resolveTransformStateWrite}.ts` and colocated specs. Modify `uploads/getBaseFields.ts`, `fields/config/reservedFieldNames.ts`, `uploads/types.ts`, and public type exports. Create `test/file-transform-state/{config,shared,transformerFixtures,int.spec}.ts` and `collections/Media/index.ts`.

**Interfaces:**

- Export conventional `CropTransform`, `FocalPointTransform`, `ResizeTransform`, `RotateTransform`, `FlipTransform`, `ClipTransform`, `PageRangeTransform`, `PosterFrameTransform`, `MetadataPolicyTransform`, and `EncodingTransform` independently as optional building blocks.
- Public `TransformState = BuiltInTransforms & Record<string, unknown>` retains built-in shapes and permits arbitrary additional keys. Runtime values must be JSON serializable.
- `resolveTransformStateWrite({ data, originalDoc, isReplacingOriginal })` tracks submission presence before merge helpers obscure omission; omission preserves, null clears, objects completely replace, empty objects normalize to null, replacing the original clears omitted state.
- `validateTransformState` checks JSON serializability, top-level object-or-null structure, and built-in shapes/known source bounds. Additional keys are accepted without definitions; adapters validate their custom values through side-effect-free planning before processing.

- [ ] Write failing field tests for all upload collections with zero transformers, reserved-field collisions, arbitrary custom keys and nested values; reject alternative values under built-in names.
- [ ] Test omitted preservation, null clearing, complete replacement with key removal, empty-object normalization, and replacement-source default clearing.
- [ ] Reject non-JSON values, invalid top-level containers, and invalid built-in shapes/bounds before source retrieval or storage writes. Test adapter rejection without partial effects separately from container validation.
- [ ] Inject a real JSON field with defaultValue null and admin.hidden true; use named built-in properties with additionalProperties enabled and built-in semantic validators. No mandatory custom-definition registry.
- [ ] Verify REST/GraphQL/Local API round trips and normal access behavior; no physical or provider identity is added by core.
- [ ] Commit open state and write semantics.

## Task 3: Extend planning for saved-key coverage and retained-source access

**Files:** Modify `uploads/transformers/{types,planTransformerPipeline,transformUploadFile,uploadTransformerBridge}.ts`. Create `uploads/transformState/planPersistedTransforms.ts` and tests. Modify source helpers established by Task 1.

**Interfaces:** Add purpose only on request planning args (use a discriminated upload/request union); successful object results add `handledTransformKeys?: string[]`. Extend `TransformFileArgs` with `originalSource: FileSource` and request args with `getOriginalFile: () => Promise<Response>`. Retain the complete doc/snapshot and stage-owned options from Task 1. `planPersistedTransforms({ doc, originalDoc, req, collectionSlug, transformers, requiredKeys, capability }): Promise<PlannedStage[]>` validates every required key has exactly one owner.

- [ ] Write failing tests for missing/duplicate claims, an unclaimed arbitrary stored key, claims for nonexistent keys, two eligible stages in declaration order, and original/current source separation.
- [ ] Assert invalid coverage performs zero lazy-source reads, storage calls, or external executor calls. Predicate callbacks themselves must remain side-effect-free.
- [ ] Add conversion tests: original PNG remains PNG; replacement JPEG becomes current MIME; an incompatible later planned stage fails rather than dropping its claimed operation. Test complete with outstanding claimed work.
- [ ] Run transformer/state unit specs; expect the new coverage tests to fail.
- [ ] Implement coverage preflight, stage-owned options, retained-source getters, and execution-time MIME/coverage checks. Built-in shape definitions never schedule a stage; custom keys need no schema registration. Boolean capability results claim no saved keys.
- [ ] Run those specs plus upload-transformer integration tests; expect pass.
- [ ] Commit the state-aware planning contract.

## Task 4: Resolve dynamic defaults before request overrides

**Files:** Modify `uploads/transformers/{handleDynamicFileRequest,resolveUploadDocument,getSourceFileResponse,finalizeFileResponse}.ts`, `uploads/endpoints/getFile.ts`, and `uploads/fileVersioning/resolveHistoricalFile.ts`. Create `uploads/transformState/canReuseStoredDefault.ts` and tests. Extend `test/file-transform-state/int.spec.ts` and request pipeline specs.

**Interfaces:** `canReuseStoredDefault({ doc, hasChanged, isReplayRequired }): boolean` checks a private managed-file entry with the relevant default/size role. Dynamic request working documents and source getters come from Tasks 1/3; no public stored/dynamic flag is introduced.

- [ ] Add a request-only Figma-style fixture: original is stored, default and variant URLs are logical, stable dimensions/MIME are populated when known, variable filesize is null/omitted, and an edit writes no derivative. A plain URL request executes two saved-default stages in order.
- [ ] Assert phase order saved A/B then override A/B; query-only quality/size changes leave stored \_transforms and metadata byte-for-byte unchanged. Original getter always returns the untouched source; current getter returns the previous response.
- [ ] Test read denial before callbacks/provider calls, removed executor on stored reusable output versus dynamic output, logical URLs without manifest ownership, and default/original filename equality. Do not use “no query string” as an original-bypass rule.
- [ ] Test variant-specific format conversion, missing/incorrect response Content-Type, complete/redirect composition, Range/ETag/header behavior, and cancellation on failure.
- [ ] Run request unit specs and `pnpm run test:int file-transform-state --run`; expect missing saved-default execution failures.
- [ ] Implement the two phases, authoritatively update accumulator MIME, and preserve existing access/header/error handling. Request transformations mutate only a cloned working doc; original URL resolution bypasses editorial transforms only for an unambiguous original target.
- [ ] Run those selections; assert zero dynamic-response objects added to the manifest, and zero request-local doc mutations persisted.
- [ ] Commit dynamic state resolution.

## Task 5: Execute stored edits from the original and commit atomically

**Files:** Modify `uploads/generateFileData.ts`, `uploads/hasCropOrResizeEdit.ts`, `collections/operations/{create,update,updateByID}.ts`, `collections/operations/utilities/update.ts`, `uploads/fileVersioning/fileOperationManager.ts` where needed, and Sharp `{prepareLegacyUpload,transformFile,handleRequest,types}.ts`. Create `uploads/transformState/prepareTransformState.ts`; extend corresponding unit specs and the new integration suite.

**Interfaces:** `prepareTransformState({ data, originalDoc, isReplacingOriginal, collectionSlug, req }): Promise<{ doc: UploadDocument; originalDoc: Readonly<UploadDocument>; hasChanged: boolean }>` resolves complete replacement semantics, legacy read compatibility, and shared validation before planning. Distinguish the operation's prior document used by hooks from the pipeline-entry snapshot; they are not interchangeable.

- [ ] Add failing tests for crop/expand/move/remove replay from original; use the spec's 4000x3000 source and assert 10%/15%/50%/40% becomes { x: 400, y: 450, width: 2000, height: 1200 }. Compare decoded regions across repeated edits, not lossy byte identity.
- [ ] Test source replacement clearing intent, explicit compatible intent on replacement, initial null, metadata-only updates avoiding processing, Sharp ordering, focal zero values, encoding MIME branches, and source/default/variant metadata after conversion.
- [ ] Test collection/field hooks changing \_transforms before execution and transformers changing it during execution; invalid final state cannot commit. Hooks are not executed twice.
- [ ] Add a fake video executor consuming built-in crop/clip/encoding and a fake PDF executor consuming pageRange/metadataPolicy/encoding; assert values replay unchanged and source limits/provider errors are enforced. Actual video transcoding and PDF processing are separate packages, not required for core vocabulary.
- [ ] Run state/Sharp unit specs and the new integration suite; expect replay/order failures.
- [ ] Reorder processing around candidate hooks: preserve upload-input metadata needed by hooks, validate the complete candidate, plan without effects, process once, validate final doc/MIME, then stage/save through the existing operation plan. Keep original snapshot unchanged and top-level owned metadata truthful. Dynamic-only editors save intent without forcing transformFile or creating a stored main.
- [ ] Remove the old percent crop/focal query write path as the authoritative route. Sharp reads canonical doc.\_transforms and can separately consume ephemeral request overrides. Configured variants consume the effective cropped source consistently and report their own MIME.
- [ ] Inject failure after file staging and during final validation/database write. Assert prior \_transforms/doc/files remain, all staged outputs are removed, and the original remains reachable. Run file-versioning file-operation regressions too.
- [ ] Commit stored processing and compensation.

## Task 6: Preserve intent through versions, duplication, removal, and migration

**Files:** Modify `collections/operations/{restoreVersion,duplicate}.ts`, `duplicateDocument/index.ts`, `uploads/fileVersioning/{restore,archive,cleanup,manifest}.ts` only where behavior requires it. Create `uploads/transformState/migrateLegacyFocalPoint.ts` and tests. Extend `test/file-versioning/int.spec.ts`, `test/file-transform-state/int.spec.ts`. Add explicit migration recipes to `docs/upload/transform-state.mdx`.

**Interfaces:** `migrateLegacyFocalPoint({ doc }): UploadDocument` returns a candidate with canonical focalPoint when canonical intent is absent and both legacy coordinates are valid, preserving zero. Never overwrite an explicitly submitted canonical value. Read compatibility can seed the editor; the first canonical save persists its complete replacement and retires legacy write authority.

- [ ] Test draft/published transforms sharing one original; restore an earlier crop through the current executor; changed codec/variant config produces a valid current output rather than guaranteeing historical bytes.
- [ ] Test missing definitions/executors on restore before file copies/current-state changes; stored historical file delivery can use valid retained bytes without replay. Remove a custom definition and prove unrelated updates preserve the exact stored object.
- [ ] Test duplication copies intent and independently owns files; prune/delete use manifest references only and ignore arbitrary provider/logical URLs inside custom intent.
- [ ] Test legacy focal 0/100, both valid legacy fields, malformed legacy values, null clearing, explicit replacement without focalPoint, and restored legacy versions. Reopening does not write merely by reading.
- [ ] Run the integration selections; expect semantic restore and legacy handling failures.
- [ ] Preflight semantic restore before the existing restore copy/staging loop. Restore original + intent together and resolve/regenerate through the current pipeline inside one coordinated operation. Keep physical cleanup reference-based.
- [ ] Provide data migration recipes for current documents and historical versions. Read old focal fields privately during transition; remove public writable fields immediately, drop old columns only after backfill. Explain irrecoverable legacy crop intent: do not infer an exact historical crop from output dimensions.
- [ ] Run state/file-versioning suites across MongoDB, Postgres, and SQLite; expect semantic and storage assertions to pass.
- [ ] Commit lifecycle and migration behavior.

## Task 7: Reopen and save the canonical crop in the Admin UI

**Files:** Under `packages/ui/src`, modify `elements/{EditUpload,Upload}/index.tsx`, `elements/Upload/getEditorFileSrc.ts`, `providers/UploadEdits/index.tsx`, `elements/{Autosave,PublishButton,SaveDraftButton,FileManager}/index.tsx`, `providers/DocumentInfo/index.tsx`, and `elements/BulkUpload/FormsManager/{index.tsx,createFormData.ts,reducer.ts}`. Create `elements/EditUpload/transformCoordinates.ts` and unit tests. Extend `test/uploads/e2e.spec.ts`; add `test/file-transform-state/e2e.spec.ts` and criterion-specific tests in `test/a11y/WCAG.e2e.spec.ts`.

**Interfaces:** `cropToPercent({ crop, sourceWidth, sourceHeight }): PercentCrop` and `percentToCrop({ crop, sourceWidth, sourceHeight }): CropTransform` are UI-boundary conversions only. Editor saves a complete canonical replacement, preserving keys owned by other editors; reset crop removes only crop. Use state-write presence to distinguish “no editor edits” from explicit null.

- [ ] Write failing tests for reopen/reload, unchanged save, expansion/movement/reset, x/y=0, focal 0, unchanged custom keys, selecting a replacement file, failed save retaining edits, and saving a request-only dynamic image without storage writes.
- [ ] Test integer boundary rounding and repeated reopen at a different preview scale; unchanged saved integers remain exactly equal.
- [ ] Run coordinate unit tests and targeted UI tests; expect canonical initialization/submission failures.
- [ ] Initialize from saved intent and retained original dimensions; use legacy focal fallback only before canonical migration. Replace truthy defaults with null-aware handling. Submit \_transforms in document data, preserving the complete replacement semantics; transport-only editor state is not a second persisted authority.
- [ ] Provide numeric X/Y/width/height and focal controls covering every drag operation, error messages identifying the coordinate, and reset/save/cancel focus behavior. Read config labels with getTranslation; reuse translations or use the translation skill if adding keys.
- [ ] Automate relevant keyboard, pointer-alternative, labels/values, validation, focus-return, and axe checks against production components. Assess WCAG 2.2 A/AA 1.1.1, 1.3.1, 1.4.3, 1.4.4, 1.4.10, 1.4.11, 1.4.12, 2.1.1, 2.1.2, 2.4.3, 2.4.6, 2.4.7, 2.4.11, 2.5.2, 2.5.3, 2.5.7, 2.5.8, 3.2.2, 3.3.1, 3.3.2, 3.3.3, 4.1.2, 4.1.3 for the changed editor flow. Record applicable evidence and exclusions, not a conformance claim.
- [ ] Run `pnpm run test:e2e file-transform-state`, the affected upload cases, and `pnpm run test:e2e a11y` narrowed to the added criteria. Confirm visual contrast/reflow/focus and meaningful announcements manually where automation cannot establish them.
- [ ] If client/server imports change, run `pnpm prepare-run-test-against-prod` then `pnpm dev:prod file-transform-state` and verify the editor against that production server. Use pinned Docker visual baselines only if visual regressions are added.
- [ ] Commit editor behavior and accessibility evidence.

## Task 8: Verify generated schemas/types, locale integration, and publish documentation

**Files:** Add `test/file-transform-state/types.spec.ts`, `payload-types.ts`, and `tsconfig.json`, database/schema assertions under the same fixture, and `docs/upload/transform-state.mdx`. Modify `docs/upload/transformers.mdx` and `docs/upload/overview.mdx`; update generated GraphQL/database snapshots using repository scripts. Integrate \_transforms into the file-bundle registry/resolver supplied by the localization dependency; identify its final paths when that branch lands.

**Interfaces:** `_transforms` generates an open object type with named built-in properties and an index signature for arbitrary additional values. Conventional shape types are separately exported with JSDoc. GraphQL uses JSON. Each SQL upload/current-version schema gains one nullable JSON/JSONB state field; adding custom keys changes no database columns.

- [ ] Test arbitrary key/value assignment, built-in shape type errors, reusable conventional type checking, JSDoc descriptions, JSON GraphQL input/output, Mongo schema snapshots, and SQL nullability/version columns; adding transform keys requires no schema migration.
- [ ] Test API access/validation parity separately through Local API, REST, and GraphQL; test MCP JSON-container validation where the existing MCP test harness supports it.
- [ ] Once file localization lands, test \_transforms joins original/default/metadata/variants in one selected/fallback bundle; absent crop cannot fall back independently. Cover locale switching, all-locale reads, replace/reset in one locale, version restore, and duplication of all file locales. Do not expose upload.localized earlier to make these tests pass.
- [ ] Generate fixture types with `pnpm run dev:generate-types file-transform-state`; run `pnpm exec tstyche test/file-transform-state/types.spec.ts`. Generate GraphQL/database schemas using the existing suite scripts. Compare expected snapshots and run Mongo/Postgres/SQLite fixture suites.
- [ ] Document exact built-in conventions, source/result MIME, replacement semantics, adapter-owned semantic validation, phase/coverage rules, dynamic-provider flow, semantic restore, unsupported saved-key coverage failures, and focal migration. Keep examples on the dependency branch's variants name.
- [ ] Run targeted lint for changed packages and final regressions: upload-transformers, file-versioning, uploads, and file-transform-state. Run CSS lint only if CSS changed. Do not broaden/repeat passing checks without a new failure or change.
- [ ] Commit generated evidence and documentation.

## Delivery and acceptance

Recommended delivery sequence is a foundation alignment PR based on `feat/file-versioning`, then core state/validation, pipeline and lifecycle, and editor/migration integration. These are review boundaries for one coordinated feature: do not release a state-editing UI before shared validation and reversible replay are ready. Type/schema/documentation changes travel with the behavior they expose.

The required end-to-end proof is: upload -> save crop -> reload editor -> expand/remove crop -> draft/publish -> restore old intent under current compatible pipeline -> duplicate -> prune. Repeat with a request-only provider and assert that only the original is stored. Exercise a fake video and PDF transformer to prove generic vocabulary without expanding this project into media-engine development.

The outstanding product decisions are settled. Task 1 implements the FileSource foundation contract and its exact bounded-read/stream interfaces; format-routing and terminal-response behavior follow the confirmed policies above. The locale slice follows the confirmed separate delivery once its foundation is available.

Planning verification performed: read the complete target tab, inspected the File Transformers/File Localization dependency contracts, and mapped the inspected feature branch to tasks. No product code changed and no runtime tests were run for this planning-only work.
