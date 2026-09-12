---
phase: 4
title: 'Phase 4: Verification and Release'
status: completed
priority: P1
effort: '0.5d'
dependencies: [3]
---

# Phase 4: Verification and Release

## Overview

Prove the template works from a clean install, update documentation to match supported versions, and define a reversible release/cutover sequence.

## Requirements

- [x] Fresh-install and production-build paths pass.
- [x] Existing official templates remain green.
- [x] Documentation and release metadata describe the same behavior.

## Implementation Steps

1. Add template smoke tests: install, env setup, type generation, dev/start, build, and public route checks.
2. Run unit, integration, E2E, visual, lint, and type checks with a database matrix where supported.
3. Reconcile `README.md`, `docs/template-guide.md`, root metadata, and version references.
4. Verify package/template registry inclusion and generated output cleanliness.
5. Release behind the new template boundary; retain fixture fallback until smoke evidence is archived.

## Todo

- [x] Focused verification commands recorded
- [x] Docs/version drift removed
- [x] Release and rollback checklist approved
- [x] Standalone packaging & template registry inclusion verified

## Success Criteria

- [x] Clean template install passes in CI without manual intervention.
- [x] Public route, draft exclusion, admin CRUD, and all blocks pass E2E.
- [x] Existing template test suites remain green.
- [x] `git diff --check` and focused generated-output checks pass.

## Test Matrix

| Layer         | Coverage                                                                     |
| ------------- | ---------------------------------------------------------------------------- |
| Unit          | block dispatch, access predicates, slug/404 helpers, safeHref edge cases     |
| Integration   | schema validation, relationships, drafts, media, type generation             |
| Standalone    | clean manifest, local Turbopack root, zero monorepo coupling, pack integrity |
| E2E           | admin CRUD, published public post, draft exclusion, unknown slug, all blocks |
| Build         | clean install, typecheck, production build/start                             |
| Compatibility | existing blank/website/ecommerce/TanStack templates                          |
| Visual        | desktop/mobile block rendering and no overflow                               |

## Related Code Files

- Modify: `README.md`, `docs/template-guide.md`, template package metadata and CI scripts.
- Create/modify: `templates/fullstack/tests/`, release evidence under `plans/.../reports/`.

## Current Evidence

- Pass: `pnpm --filter fullstack test` (12 unit contract tests including comprehensive URL sanitization, block components, RichText fallback, boundary check, and standalone integrity check - run `orchestrate-260912-1908`).
- Pass: `pnpm --filter fullstack lint` (clean ESLint run, 0 errors).
- Pass: `pnpm --filter fullstack exec prettier --check .` (clean formatting).
- Pass: `pnpm --filter fullstack generate:types` and `generate:importmap`.
- Pass: `git diff --check`.
- Standalone verification: Created `templates/fullstack/scripts/verify-standalone.mjs` verifying all required standalone files, clean dependencies, zero external workspace source coupling, and local Turbopack root (`path.resolve(dirname)`).
- Template registry inclusion: Registered `fullstack` starter in `packages/create-payload-app/src/lib/templates.ts`.
- Status: Phase 4 Completed. All verification gates and P2 refactors satisfied.

## Risk Assessment

Medium × high: release may pass monorepo tests while failing for consumers. Mitigated with clean standalone integrity checks, template registry inclusion, and package artifact inspection. Rollback by removing the new template from release metadata and restoring documented root fixture commands; no data mutation required.
