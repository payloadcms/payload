# Admin accessibility tests

## Run

```bash
pnpm test:a11y --workers=1                         # Workflows and scanner validation
pnpm test:a11y --grep 'Relationships and drawers'  # One workflow
pnpm test:a11y:audit --workers=1                   # Original audit only
pnpm test:a11y:audit --grep '2.4.3'                # One audit criterion
pnpm test:a11y --grep 'Focus Indicators Test Page' # Scanner validation only
pnpm test:a11y:screen-reader                      # Guidepup; configured OS required
```

Commands start the a11y app and reset/seed its fixtures. Set `PORT` if needed.
`pnpm test:e2e a11y --audit` is equivalent to the audit command.

## Suites

- **`e2e.spec.ts`**: 31 workflow cases with enhanced contrast enabled, combining keyboard/focus assertions and axe checkpoints on real admin components.
- **`WCAG.audit.spec.ts`**: tests for validation of audit findings, grouped by WCAG criterion and ticket. Explicit command only; excluded from normal CI.
- **`focus-indicators.e2e.spec.ts`**: browser tests validating the shared `checkFocusIndicators` scanner against deliberate good/bad fixtures; runs alongside the workflows.
- **`screen-reader.spec.ts`**: separate VoiceOver/NVDA verification; excluded from normal CI.

CI runs both E2E specs in a dedicated job when `needs_a11y` matches UI, frontend logic, or relevant dependency/test-infrastructure changes.
