---
name: payload-accessibility
description: Use when building or assessing Payload UI, changing styles, content, interactions, focus, keyboard behavior or semantics, or working on accessibility tests or WCAG/VPAT evidence.
---

# Payload Accessibility

Assess accessibility from design through verification. Limit conclusions to the behavior and states evaluated.

## On-demand check

Invoke in chat, with optional `check`:

```text
$payload-accessibility my current UI changes
$payload-accessibility check content branching on origin/feat/content-branching
```

Scope may be a feature, paths, PR or branch comparison; omitted scope means current local changes. Report the actual revision and comparison. Never silently substitute another branch or older implementation.

A standalone invocation, with or without `check`, is assessment-only: inspect code, run relevant existing checks and exercise the UI with local test data as needed. Do not edit implementation or tests. Report findings, evidence, proposed fixes and verification gaps, then wait for approval.

After approval, make the approved fixes and regression tests locally; continue editing and verifying within that scope without further approval. Report each original finding as passing, failing or unverified, with evidence. Wait for approval before any commit or push. Fix approval does not authorise committing or publishing. Follow the user's explicit scope and instructions.

During feature development, apply the workflow within the task's authorised scope.

## Change assessment

Follow [change-assessment.md](references/change-assessment.md), proportionally to the change:

1. Trace the feature/files/diff through relevant shared components, styles, providers and tests to the affected journey. Before code exists, use intended behavior and revisit during implementation.
2. Identify affected states, inputs, viewports and assistive-technology behavior. Define observable expectations before implementation.
3. Read [wcag-2.2-aa.md](references/wcag-2.2-aa.md). Assess every plausibly affected A/AA criterion, beyond those named in an issue; resolve uncertainty using linked W3C guidance.
4. Prefer native HTML. Composite ARIA patterns require complete semantics and keyboard behavior.
5. Follow [testing.md](references/testing.md). Reuse sufficient evidence; fill gaps with focused checks against production components in context.
6. Within authorised implementation, reproduce and fix confirmed barriers, then verify. In assessment-only work, report without editing implementation or tests until fixes are approved. Distinguish failures, risks and coverage gaps.

## Payload contrast mode and remediation scope

Check feature contrast with enhanced contrast mode enabled: verify `html[data-enhanced-contrast]` and test the relevant light/dark theme and interaction state. Enabling the mode does not replace the other accessibility checks. Use the existing mode-switching tests rather than rechecking the shared setting for each feature; see [contrast setup](references/testing.md#payload-enhanced-contrast-setup). Continue checking ordinary-mode integration and behavior, but do not use an ordinary-mode contrast measurement alone to replace the shared palette in a feature.

If a measurement still fails, first verify the intended component variant, semantic tokens, inherited theme and loaded shared styles. Fix incorrect feature usage or custom styling at its source. A reproducible defect inherited from a shared component belongs to that component's owner; resolve it within authorized scope or report it with the exact mode/state and evidence. Do not add a feature-local color override merely to make a contrast check pass. Record the tested mode explicitly; enhanced-mode evidence does not establish contrast conformance for ordinary mode.

## Test placement

- General browser regressions: `test/a11y/e2e.spec.ts`, grouped by workflow with keyboard/focus assertions and axe checkpoints.
- Audit validation: `test/a11y/WCAG.audit.spec.ts`, explicit audit command only.
- Speech/virtual-cursor evidence: `test/a11y/screen-reader.spec.ts`, grouped by criterion.
- Shared setup: `test/a11y/helpers.ts`; scenario-specific setup stays in its spec.
- Keep component unit tests beside their component to verify low-level contracts; they cannot replace end-to-end evidence of a barrier in the rendered application.
- Reuse existing test configurations and real UI; see `testing.md` for feature-fixture fallback. Do not create fixtures or criterion files by default.

## Evidence boundaries

- Clean axe scans do not prove criterion or product conformance.
- DOM/accessibility-tree assertions do not prove exact speech. Use Guidepup for speech/cursor outcomes, regardless of how an issue was discovered.
- Require human visual/AT confirmation when judgement, timing or platform behavior cannot be reliably automated.
- AA conformance requires all applicable A and AA criteria. Qualified human review is required for VPAT/ACR conformance statements.

## Handoff

Keep it short; use a table when helpful. Include:

- Assessed UI, states, input methods, browser/version, viewport, theme and relevant settings.
- Applicable A/AA criteria, why they apply, and verified/unverified outcomes.
- Findings/fixes: file/line, reproduction state and user impact; distinguish confirmed failures, suspected risks and coverage gaps.
- Commands and actual results, including failed, skipped and not-run checks.
- Remaining visual/AT verification, failures and limitations.

For verified UI fixes, follow [record-pr-demo](../record-pr-demo/SKILL.md), including its local preview, approval and publishing requirements. Never commit demo media. Recordings supplement tests, not screen-reader verification.

Never claim conformance beyond the evidence.
