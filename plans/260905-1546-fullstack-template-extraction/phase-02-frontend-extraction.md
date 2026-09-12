---
phase: 2
title: 'Phase 2: Frontend Extraction'
status: completed
priority: P1
effort: '1d'
dependencies: [1]
---

# Phase 2: Frontend Extraction

## Overview

Move the public post route, block renderer, components, metadata, and styling into the template while preserving server-side published filtering and graceful handling of unknown blocks.

## Requirements

- [ ] Public route depends only on template-local config/types/components.
- [ ] Block rendering is discriminated and null-safe.
- [ ] Public styling uses a small shared token layer, not scattered inline constants.

## Implementation Steps

1. Port `posts/[slug]` and route-level data helpers.
2. Port `RenderBlocks`, Hero, FeatureGrid, and CallToAction with stable block contracts.
3. Add published-only query constraints, 404 handling, and unknown-block fallback.
4. Replace hardcoded visual values with template-local semantic CSS tokens aligned to `DESIGN.md`.
5. Add frontend unit and route-level tests before changing fixture wiring.

## Todo

- [ ] Public route extracted
- [ ] Blocks and styles extracted
- [ ] Fixture and template rendering compared

## Success Criteria

- [ ] Template source contains no imports from `test/_community`.
- [ ] Published post renders every supported block.
- [ ] Draft and missing slug produce 404 without content leakage.
- [ ] Mobile layout has no horizontal overflow at supported breakpoints.

## Architecture and Data Flow

Request `/posts/:slug` → Local API query with slug + published constraint → post document → rich text + layout array → `RenderBlocks` → typed block component → HTML/metadata.

## Related Code Files

- Create/modify: `templates/fullstack/src/app/`, `templates/fullstack/src/components/`, `templates/fullstack/src/styles/`.
- Tests: `templates/fullstack/tests/e2e/`, frontend unit/integration test locations per template convention.
- Reference: `app/(app)/`, `app/(app)/components/blocks/`.

## Risk Assessment

High risk: route behavior can diverge during porting. Mitigate with contract tests against seeded published/draft records and snapshot/visual comparison. If CSS token migration changes visual intent, preserve semantic token names and adjust values rather than reintroducing inline styles.
