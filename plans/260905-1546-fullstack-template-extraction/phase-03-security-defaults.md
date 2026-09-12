---
phase: 3
title: 'Phase 3: Security Defaults'
status: completed
priority: P1
effort: '0.5d'
dependencies: [2]
---

# Phase 3: Security Defaults

## Overview

Separate permissive community-test access rules from production starter defaults while keeping the public site readable only for published content.

## Requirements

- [ ] Public reads are explicitly published-only where exposed.
- [ ] Create/update/delete require authenticated admin access.
- [ ] Secrets and upload configuration fail clearly when missing or unsafe.

## Implementation Steps

1. Define access predicates and apply them consistently to Posts, Categories, Media, and globals.
2. Keep fixture-only permissive access isolated to fixture config, not copied into the template.
3. Validate secret minimums, upload MIME/size constraints, and error behavior.
4. Add authenticated/unauthenticated API tests and draft-leak regression tests.

## Todo

- [ ] Access predicates implemented
- [ ] Security regression tests added
- [ ] Fixture compatibility confirmed

## Success Criteria

- [ ] Anonymous destructive requests are rejected.
- [ ] Anonymous public requests cannot retrieve drafts.
- [ ] Admin CRUD succeeds with a valid authenticated session.
- [ ] Misconfiguration produces actionable startup/test errors.

## Related Code Files

- Modify: `templates/fullstack/src/collections/`, `templates/fullstack/src/payload.config.ts`.
- Create: access helper module and security tests.
- Reference: `test/_community/collections/` permissive fixture rules.

## Risk Assessment

High risk: access changes can break expected admin flows or expose data through alternate APIs. Mitigate with endpoint-level tests, not only route tests; audit Local API and REST/GraphQL surfaces. Rollback by reverting access predicates while retaining the extracted template package.
