---
phase: 1
title: 'Phase 1: Schema and Template Boundary'
status: completed
priority: P1
effort: '1d'
dependencies: []
---

# Phase 1: Schema and Template Boundary

## Overview

Define and create the canonical `templates/fullstack` boundary by extracting schemas, blocks, config, and generated-type ownership from the `_community` fixture without changing public contract names.

## Requirements

- [ ] Template source is self-contained and does not import `test/_community`.
- [ ] Existing collection/block slugs and generated field contracts remain stable.
- [ ] Seed data is idempotent and isolated from production runtime by explicit configuration.

## Implementation Steps

1. Inventory `test/_community/config.ts`, collections, blocks, globals, adapters, seed hooks, and generated types.
2. Create the template manifest, source config, collections, blocks, globals, and environment example following existing template conventions.
3. Copy only reusable schema/config code; replace fixture-relative imports with template-local imports.
4. Define type-generation ownership and a compatibility note for existing fixture data.
5. Add a static boundary check that fails if template runtime source imports `test/`.

## Todo

- [ ] Schema/config extraction complete
- [ ] Boundary check added
- [ ] Contract diff reviewed against current generated types

## Success Criteria

- [ ] `pnpm --filter <fullstack-template> generate:types` succeeds.
- [ ] No `test/_community` import exists under `templates/fullstack/src`.
- [ ] Existing fixture contracts have a documented one-to-one mapping.

## Architecture and Data Flow

`payload.config.ts` imports template-local collections/blocks → Payload validates config → database adapter persists content → generated `payload-types.ts` becomes the only frontend type source.

## Related Code Files

- Create: `templates/fullstack/src/payload.config.ts`, collections, blocks, globals, `package.json`, tests.
- Reference: `test/_community/config.ts`, `test/_community/collections/`, `test/_community/blocks/`.
- Modify later: root template registry only if required by existing conventions.

## Risk Assessment

High risk: copying fixture-only imports or hooks silently preserves coupling. Mitigate with boundary grep, clean-install compilation, and generated-type diff. If schema behavior differs, stop extraction and retain the fixture until an explicit contract decision is made.
