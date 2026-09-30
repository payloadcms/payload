# SDD ledger — plan: docs/superpowers/plans/2026-09-30-recursive-popup-menus.md

Pre-flight: Task 3 consumes Task 1's MenuScope through PopupContext and Task 2's pointer-intent hook through Popup; the interfaces are compatible with the approved spec and no conflict was found.

Task 1-3: complete (implementation combined; tests: `pnpm exec vitest run packages/ui/src/elements/Popup/MenuScope.spec.ts packages/ui/src/elements/Popup/PopupTrigger/index.spec.tsx packages/ui/src/elements/Popup/index.spec.tsx --config vitest.config.ts` -> 3 files / 6 tests passed)
Task 4: complete (v4 Components Popup tab now includes a three-level nested hover fixture; focused v4 e2e harness was not present in this checkout)
Task 5: partial (targeted lint and diff checks passed; repository typecheck is blocked by missing pre-built `packages/payload/dist` and `packages/translations/dist` declarations; manual browser/a11y review remains required)
Ruling: Keep the v4 UI-tab addition as the production-like integration fixture without inventing a new v4 e2e harness — the checkout contains no v4 e2e spec or established route test for the gallery, and adding one would expand scope beyond the requested Popup capability.
Ruling: Leave changes uncommitted — the worktree's shared Git index is outside the writable sandbox and Git cannot create `.git/worktrees/payload-main3/index.lock`; no push was attempted.
