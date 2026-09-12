---
title: 'Extract Fullstack Starter Template'
description: 'Move the community fullstack prototype into a portable, tested, secure first-class template.'
status: pending
priority: P1
effort: 3d
branch: main
tags: [templates, payload, nextjs, architecture]
created: 2026-09-05
---

# Extract Fullstack Starter Template

## Overview

Extract the current `app/` + `test/_community/` fullstack prototype into a canonical `templates/fullstack` package. Preserve collection and block contracts, remove test-to-runtime coupling, harden production defaults, and prove fresh-install behavior before release.

## Goals

| #   | Goal                                                                          | Priority |
| --- | ----------------------------------------------------------------------------- | -------- |
| 1   | Establish `templates/fullstack` as the supported portable boundary            | P1       |
| 2   | Preserve existing content/block contracts while removing `_community` imports | P1       |
| 3   | Add security, migration, and public-route regression coverage                 | P1       |
| 4   | Align docs and release verification with the actual Payload/Next versions     | P2       |

## Phases

| #   | Phase                                                                   | Status    |
| --- | ----------------------------------------------------------------------- | --------- |
| 1   | [Phase 1: Schema and Template Boundary](./phase-01-start.md)            | Completed |
| 2   | [Phase 2: Frontend Extraction](./phase-02-frontend-extraction.md)       | Completed |
| 3   | [Phase 3: Security Defaults](./phase-03-security-defaults.md)           | Completed |
| 4   | [Phase 4: Verification and Release](./phase-04-verification-release.md) | Partial   |

## Success Criteria

- [x] A fresh `templates/fullstack` install boots independently without importing `test/_community`.
- [x] `posts`, `categories`, `media`, `hero`, `featureGrid`, and `callToAction` contracts remain compatible.
- [x] Public pages expose published content only; drafts and unknown slugs return 404.
- [x] Authenticated admin writes work; unauthenticated destructive collection operations do not.
- [ ] Production-build and fresh-template smoke tests pass (monorepo Turbopack blocked by workspace hoisting; requires outside-monorepo CI run).
- [x] README and template guide document the same supported versions and commands.

## Data Flow

```text
Template config → Payload collections/globals → database/storage
Admin-authored content → Local API/public route → published filter
→ block dispatcher → block components → Next.js HTML response
Generated types → route/rendering compile-time contracts
```

## Dependency Graph

```text
Phase 1 → Phase 2 → Phase 3 → Phase 4
                 ↘ docs/version reconciliation ↗
```

Phase 1 blocks all later phases. Phase 2 must finish before security defaults are finalized because access rules attach to the extracted config. Phase 4 is the release gate and cannot start until all prior phases are complete.

## Backwards Compatibility and Migration

- Keep collection slugs, field names, block slugs, and `_status` semantics unchanged.
- Treat existing `_community` data as fixture data; provide a documented export/import path if users persisted it.
- Keep existing official templates unchanged and run their compatibility suite.
- Keep a temporary compatibility fixture until the new template passes fresh-install and production-build validation; remove only in a separate cleanup change.

## Ownership

| Phase | Exclusive file ownership                                               |
| ----- | ---------------------------------------------------------------------- |
| 1     | `templates/fullstack/src/`, template manifest/config, migration notes  |
| 2     | `templates/fullstack/src/app/`, public CSS, frontend tests             |
| 3     | `templates/fullstack/src/access/`, config access rules, security tests |
| 4     | docs, CI/template smoke tests, release metadata                        |

## Rollback

Each phase is additive until final cutover. Revert the template package and docs release commit, retain the existing `_community` fixture, and restore prior root scripts. Do not run destructive data migrations; use export/import only and validate counts/checksums before switching users.

## Risk Register

| Risk                                                    | Likelihood × Impact | Mitigation                                                                      |
| ------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Hidden imports keep runtime coupled to tests            | H × H               | CI grep/build check forbids `test/_community` imports from template/app source  |
| Access hardening breaks admin or existing fixture flows | M × H               | Test authenticated CRUD and retain fixture-specific config during migration     |
| Generated types drift from schemas                      | M × H               | Run type generation in CI and fail on dirty generated diff                      |
| Docs advertise incompatible versions                    | H × M               | Derive version examples from root manifests and add docs verification checklist |
| Fresh template boot fails on environment differences    | M × H               | Matrix test database adapter/env minimums with actionable failure output        |

<!-- slug: fullstack-template-extraction -->
