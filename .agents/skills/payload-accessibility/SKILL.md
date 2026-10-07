---
name: payload-accessibility
description: Use when changing or reviewing rendered Payload UI, interaction or focus behavior, semantic markup, accessibility tests, or WCAG/VPAT evidence.
---

# Payload Accessibility

Assess accessibility as part of the change, not as a scan added afterward. Scope conclusions to the behavior and states actually evaluated.

## Change assessment

For every affected component or flow:

1. Identify the rendered states, input methods, viewport conditions, and assistive-technology behavior the change can affect.
2. Read [wcag-2.2-aa.md](references/wcag-2.2-aa.md). Assess every plausibly affected WCAG 2.2 Level A and AA criterion; do not limit review to criteria named in an issue.
3. Prefer native HTML semantics. When a composite ARIA pattern is necessary, implement its complete semantics and keyboard behavior rather than adding roles or states in isolation.
4. Read [testing.md](references/testing.md) and select evidence based on the observable outcome.
5. Exercise the changed behavior in every relevant state. Accessibility checks must cover the production component and integration context, not a simplified substitute.

## Test placement

- Put browser-observable, criterion-level accessibility evidence in `test/a11y/WCAG.e2e.spec.ts`, inside the numerically ordered `test.describe` group for its primary criterion.
- Put evidence that depends on synthesized speech or a screen-reader virtual/browse cursor in `test/a11y/screen-reader.spec.ts`, under the same criterion organization.
- Put setup shared by both accessibility specs in `test/a11y/helpers.ts`. Keep scenario-specific setup in its spec.
- Keep low-level unit tests beside their component when they verify an implementation contract. They supplement, but do not replace, an end-to-end WCAG regression when the reported barrier occurs only in the rendered application.
- Reuse the existing `test/a11y` Payload configuration and real UI components. Do not create a new accessibility fixture or criterion file by default.

## Evidence boundaries

- Axe finds a subset of machine-detectable failures. A clean scan is not proof of criterion or product conformance.
- DOM and accessibility-tree assertions do not prove exact spoken output.
- Guidepup is for outcomes that specifically depend on screen-reader output or cursor behavior, not every issue originally discovered with a screen reader.
- Require human visual or assistive-technology confirmation only when the outcome depends on judgement, timing, platform behavior, or an interaction that reliable automation does not reproduce.
- WCAG 2.2 Level AA conformance requires all applicable Level A and Level AA criteria. A qualified human reviewer approves VPAT/ACR conformance statements.

## Required handoff

Report:

1. The affected UI, states, and interaction methods assessed.
2. The WCAG 2.2 A/AA criteria assessed and why they were applicable or potentially affected.
3. Automated tests and commands run, with their results.
4. Required visual, screen-reader, or other manual verification.
5. Known failures, limitations, and any criterion that cannot yet be supported.

Never report a component, criterion, or product as conforming beyond the evidence collected.
