# Recursive Popup Menus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add generic recursive submenu coordination and hover activation to `packages/ui` Popup, with component, v4 UI-tab, and accessibility coverage.

**Architecture:** `Popup` will keep local rendered-open state, while a factory-created `MenuScope` coordinates only direct child submenu nodes. A nested Popup registers with its nearest menu scope and provides a new scope to its own children. A local pointer-intent hook will own hover timing and trigger/content geometry; it will delegate sibling coordination to the scope.

**Tech Stack:** React, TypeScript, Vitest browser tests, Playwright, Payload UI, existing Popup popover and ARIA patterns.

**Spec:** `docs/superpowers/specs/2026-09-30-recursive-popup-menus-design.md`

## Global Constraints

- Keep this a generic `packages/ui` Popup capability; do not modify UserMenu, account triggers, or navigation layout.
- Add only `hoverSubmenu?: boolean` to the public Popup API; keep timing values internal.
- Preserve root popups, nested press-opened menus, `showOnHover`, controlled `forceOpen`, and trigger render-prop behavior.
- Use test-first development: every production behavior begins with a failing test.
- Assess affected WCAG 2.2 Level A and AA criteria and report automated and manual evidence.
- Preserve unrelated user changes and do not alter generated v4 runtime artifacts for cleanliness.

## Review Focus

- Descendant content rendered through the popover/top-layer path must keep every active ancestor open; cover with three-level hover interaction tests.
- Switching a sibling at any depth must close the old branch recursively without closing shared ancestors; cover at component and v4 integration levels.
- Delayed pointer intent must not override a return to the active branch or leave stale timers after close/reopen; cover with fake-timer interaction tests.
- Mixed hover and press nesting must use one ownership tree while preserving immediate keyboard/click activation; cover with mixed-mode tests.
- Menu ARIA and focus behavior must remain correct at every depth, including ArrowRight/ArrowLeft/Escape/Tab exits; cover with component and a11y tests.

### Task 1: Add direct-child menu scope coordination

**Files:**

- Create: `packages/ui/src/elements/Popup/MenuScope.ts`
- Create: `packages/ui/src/elements/Popup/MenuScope.spec.ts`

**Interfaces:**

- Produces `createMenuScope()` with `register`, `requestOpen`, `cancelPending`, and `closeActiveBranch` operations matching the spec’s `MenuScope` and `SubmenuNode` contracts.

- [ ] **Step 1: Write failing scope tests** for sibling activation, recursive branch close, pending-open cancellation, unregister cleanup, and reopening after cleanup.
- [ ] **Step 2: Run the focused scope test and verify it fails for the missing coordinator.**
- [ ] **Step 3: Implement the minimal factory-created direct-child scope with stable active/pending IDs and recursive node callbacks.**
- [ ] **Step 4: Run the focused scope tests and verify they pass.**

### Task 2: Add local submenu pointer intent

**Files:**

- Create: `packages/ui/src/elements/Popup/useSubmenuPointerIntent.ts`
- Create: `packages/ui/src/elements/Popup/useSubmenuPointerIntent.spec.ts`

**Interfaces:**

- Produces `useSubmenuPointerIntent({ contentRef, enabled, onOpen, onClose, onEnterBranch, onLeaveBranch })`, returning trigger/content pointer handlers and timer cleanup for a single submenu.

- [ ] **Step 1: Write failing tests** for immediate first-child hover, delayed sibling hover, cancellation on branch return, content containment, safe-corridor transit, shorter landed close delay, and cleanup on close/unmount.
- [ ] **Step 2: Run the focused hook tests with fake timers and verify expected failures.**
- [ ] **Step 3: Implement local pointer geometry and internal timing constants without adding public tuning props or sibling-registry knowledge.**
- [ ] **Step 4: Run the focused hook tests and verify they pass.**

### Task 3: Integrate recursive scopes, activation, closing, and keyboard behavior into Popup

**Files:**

- Modify: `packages/ui/src/elements/Popup/index.tsx`
- Modify: `packages/ui/src/elements/Popup/PopupTrigger/index.tsx`
- Create: `packages/ui/src/elements/Popup/index.spec.tsx`

**Interfaces:**

- Extends `PopupProps` with `hoverSubmenu?: boolean`.
- Keeps `PopupContext` nearest-scope semantics private to Popup; nested menu triggers continue to expose menuitem roles, roving tab indexes, `aria-haspopup`, `aria-expanded`, and `aria-controls`.

- [ ] **Step 1: Write failing browser component tests** for three hover levels, deepest sibling switching, top-level branch replacement, hover/press/hover nesting, non-hover root behavior, stale-state-free reopen, keyboard traversal/focus restoration, and complete-chain Tab dismissal.
- [ ] **Step 2: Run the Popup browser tests and verify they fail because recursive ownership and hover activation are absent.**
- [ ] **Step 3: Add stable per-popup node registration, child-scope provisioning, unified open/close operations, and recursive descendant cleanup.**
- [ ] **Step 4: Wire `hoverSubmenu` pointer handlers into triggers/content while preserving click, keyboard, `showOnHover`, `forceOpen`, and pointer-no-focus behavior.**
- [ ] **Step 5: Add ArrowRight/ArrowLeft submenu opening and closing/focus restoration while retaining current menu-local ArrowUp/ArrowDown/Home/End behavior.**
- [ ] **Step 6: Run Popup component tests and the existing PopupTrigger tests; verify all pass.**

### Task 4: Add nested hover coverage to the v4 Components Popup tab

**Files:**

- Modify: `test/v4/views/Components/sections/Popup.tsx`
- Modify: `test/v4/views/Components/index.tsx` only if the tab needs stable test targeting or route wiring

**Interfaces:**

- Produces a real v4 UI-tab fixture using exported `Popup` components with at least three levels, mixed hover/press nesting, sibling branches, and accessible labels/data attributes suitable for Playwright.

- [ ] **Step 1: Add the v4 fixture and a failing end-to-end test** that opens the Popup tab, exercises nested hover menus, verifies ancestor persistence and sibling replacement, and checks keyboard focus/ARIA state.
- [ ] **Step 2: Run the focused v4 test and verify it fails against the current Popup behavior.**
- [ ] **Step 3: Adjust only the v4 fixture/test selectors and assertions needed to express the generic Popup contract; do not add account-nav behavior.**
- [ ] **Step 4: Run the focused v4 test against the production-like test app and verify it passes.**

### Task 5: Add production accessibility evidence and complete verification

**Files:**

- Modify: `test/a11y/WCAG.e2e.spec.ts`
- Modify: `test/a11y/helpers.ts` only for reusable menu traversal helpers
- Modify: `test/a11y/screen-reader.spec.ts` only if a cursor-level regression is directly required

- [ ] **Step 1: Add a production-component accessibility regression** covering pointer persistence, keyboard traversal, dismissal, focus restoration, and ARIA relationships at nested levels.
- [ ] **Step 2: Run the focused a11y test and verify it fails before the implementation is present.**
- [ ] **Step 3: Run the complete relevant UI, v4, and accessibility test commands plus lint/type checks.**
- [ ] **Step 4: Perform manual verification of pointer intent, visible focus, viewport-edge flipping, and dense sibling movement; document any limitations.**
- [ ] **Step 5: Review the final diff to confirm no UserMenu/navigation changes or generated v4 runtime artifacts were introduced.**

## Accessibility Assessment

Assess WCAG 2.2 criteria 1.3.1, 1.4.13, 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.4.11, 2.5.2, 2.5.8, 3.2.1, 3.2.3, 3.2.4, and 4.1.2 as applicable to nested menu semantics, hover persistence, keyboard exits, focus visibility/order, pointer activation, target sizing, and state relationships. Automated DOM/ARIA assertions do not replace visual timing or assistive-technology verification.
