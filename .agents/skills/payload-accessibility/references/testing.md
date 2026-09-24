# Accessibility testing

## Choose evidence by observable behavior

| Outcome to prove                                                                        | Primary evidence                                                                                   |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Accessible name, role, value, state, or relationship                                    | Playwright assertion against the rendered component                                                |
| Keyboard operation, focus movement, dismissal, or focus restoration                     | Playwright interaction test                                                                        |
| Reflow, clipping, target size, or DOM geometry                                          | Playwright measurement; add human visual review when quality or spatial meaning requires judgement |
| Broad machine-detectable violations in a rendered state                                 | Existing `runAxeScan` helper                                                                       |
| Exact synthesized speech, virtual cursor, browse mode, or assistive-technology grouping | Guidepup, with human confirmation when timing or platform behavior remains unreliable              |
| Meaningful order, visible focus quality, sensory meaning, or other subjective outcome   | Human review, supported by automated checks where possible                                         |

The tool used by an original auditor does not determine the test layer. If Playwright can directly observe the reported name, role, state, relationship, focus, or keyboard behavior, keep the regression in the browser suite. Use Guidepup only when spoken output or screen-reader cursor behavior is itself the expected result.

## Canonical suites

- `test/a11y/WCAG.e2e.spec.ts` contains browser-observable criterion evidence.
- `test/a11y/screen-reader.spec.ts` contains Guidepup VoiceOver and NVDA evidence.
- `test/a11y/helpers.ts` contains setup reused by both suites.
- `test/a11y/e2e.spec.ts` remains the existing broad accessibility-scan and page-level suite.

Use ordered `test.describe` groups named with the WCAG criterion and level. A test belongs under its primary criterion; note secondary affected criteria in the handoff rather than duplicating the scenario. Consolidate tests only when one arrangement, interaction, and assertion genuinely exercises every covered case.

Use the existing a11y Payload config and real UI components. Keep scenario-specific setup in its WCAG spec. Extract a helper only when both canonical specs use it.

## Regression quality

Before remediation, reproduce the reported state and verify that the assertion fails for the accessibility barrier—not navigation, fixture, selector, or server setup. After remediation, require the same assertion to pass.

A test that already passes may represent an existing fix or a weak assertion. Recreate the exact page state, data, interaction method, and platform conditions; compare the assertion with the actual reported outcome; and strengthen proxy assertions. Never manufacture a failure with `test.fail`.

Skipped or fixme tests are not conformance evidence. Tests should prove observable behavior rather than the presence of an implementation detail such as an ARIA attribute when user-facing behavior can be asserted directly.

## Axe

Reuse the existing accessibility scan suite when it already covers the relevant page state. Otherwise call `runAxeScan` once per unique rendered state where it adds value, not once per criterion. Retain its JSON results as automated evidence, but do not convert rule tags directly into a conformance statement.

## Guidepup

The screen-reader spec deliberately does not match the repository's `*e2e.spec.ts` CI discovery pattern. Until dedicated macOS and Windows runners exist, run it in a supported local or manually triggered environment.

Configure a test machine once:

```bash
pnpm dlx @guidepup/setup setup
pnpm dlx @guidepup/setup install
pnpm exec playwright install webkit # macOS / VoiceOver
pnpm exec playwright install firefox # Windows / NVDA
```

The operating-system setup changes accessibility and automation permissions, so a developer must explicitly review and run it on the test machine. Do not silently substitute a DOM assertion as proof of spoken output.

## Commands

```bash
# Targeted browser evidence
pnpm test:e2e a11y --grep "<test name or WCAG criterion>" --workers=1

# Complete browser WCAG evidence suite
pnpm test:e2e a11y --grep "WCAG" --workers=1

# Screen-reader evidence on a configured macOS or Windows machine
pnpm test:a11y:screen-reader
```

Run affected tests while developing. Before handoff, run the complete relevant suite and report any check that could not run in the current environment.
