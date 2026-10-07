# Transform State MCP Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Keep optional custom transform definitions from imposing core runtime validation through MCP.

**Architecture:** Allow a JSON field to supply an optional `jsonSchema.inputSchema`, falling back to its existing `schema`. Transform state supplies its open built-in schema for inputs and retains the enriched schema for output types and JSDoc. MCP and CLI already consume the shared input schema generator, so both inherit consistent behavior without tool-specific exceptions.

**Tech Stack:** TypeScript, JSON Schema, Zod, Vitest.

**Spec:** [Original specification](./2026-10-05-file-transform-state-spec.md), amended by the user's approved arbitrary custom keys, adapter-owned validation, and optional definitions contract recorded in [verification](./2026-10-05-file-transform-state-verification.md).

## Global Constraints

- All transform keys are optional; `_transforms` defaults to null; an empty root object normalizes to null.
- Built-in shapes remain validated and cannot be redefined.
- Arbitrary additional JSON-compatible keys require no registration; adapters own custom validation and operation order.
- Existing JSON fields without an input override retain their current behavior.
- This fix covers MCP parity only; encoding target MIME, malformed optional definitions, and incomplete JSDoc remain separate audit items.

## Review Focus

- A declared custom key may hold a JSON value outside its optional documentation schema until its adapter validates it.
- Undeclared custom keys remain accepted.
- Malformed built-in values remain rejected by input validation.
- Null, empty roots, and omitted transform keys remain accepted; canonical writes still normalize empty roots.
- Output schemas retain named custom definitions and descriptions; building input schemas must not mutate them.

### Task 1: Separate transform input validation from optional definitions

**Files:** Modify `packages/payload/src/fields/config/types.ts`, `packages/payload/src/utilities/configToJSONSchema.ts`, `packages/payload/src/uploads/transformState/buildTransformStateJSONSchema.ts`; add `packages/payload/src/utilities/entityInputSchema/transformState.spec.ts`; extend `packages/payload/src/utilities/configToJSONSchema.spec.ts`; update `docs/upload/transform-state.mdx`.

**Interfaces:** `JSONField.jsonSchema.inputSchema?: JSONSchema4` is consumed when generating an input schema; `schema` remains the output/editor schema. `buildTransformStateJSONSchema({ transformers })` supplies an independent built-in input schema and an enriched output schema.

- [x] Add a regression exercising `validateCollectionData` and `getCollectionInputSchema` with optional watermark definitions. Require declared and undeclared JSON custom values to pass create/update prevalidation; invalid built-in shapes to fail; null, empty, and omitted state to pass.
- [x] Run the regression and confirm the custom-value case fails with the existing object-shape restriction.
- [x] Add `inputSchema` support with fallback, and provide transform state's built-in input schema independently of optional definitions.
- [x] Verify output definitions/descriptions remain intact and ordinary JSON fields retain structural input validation; test an explicit input override through the shared generator.
- [x] Update public transform-state documentation to describe consistent MCP/CLI input behavior and adapter responsibilities.
- [x] Run focused schema/transform units, the full unit project, core TypeScript, and changed-source lint. Review the diff with a fresh reviewer and record results here.

## Execution notes

Implementation is authorized in this session. Preserve the pre-existing AGENTS.md and tsconfig.base.json edits. Leave the fix reviewable locally; no push or merge is part of this request.

## Verification

- The create/update custom-value regressions failed before the fix; the independent JSON input override regression also failed before implementation.
- Focused schema, transform-state and MCP file-input units: 10 files, 79 tests passed.
- Full unit project: 366 files passed, 1 skipped; 3,744 tests passed, 4 skipped. The initial restricted run exposed network/socket limitations and missing compiled CLI/template artifacts. After generating those artifacts, the full run passed with the required access.
- RSC project: 1 file, 2 tests passed.
- Core `tsc -b`: passed. Changed-source ESLint: zero errors, five warnings (three ignored test files and two existing explicit-any warnings). `git diff --check`: passed.
- Fresh independent review: no actionable Critical or Important findings; reviewer independently ran 32 affected tests successfully.

The input schema validates the standard built-in structures and accepts arbitrary custom values; complete document writes still run JSON compatibility, built-in semantic checks and adapter validation. Output schemas retain named optional custom properties and descriptions. Ordinary JSON fields without an input override retain their prior schema behavior.
