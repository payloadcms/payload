# Admin E2E TanStack Triage

Ran admin E2E suites against TanStack (`PAYLOAD_FRAMEWORK=tanstack-start`) and triaged pass/fail status.

## Suite Status

- `admin__e2e__general`: **53 failed**, **30 passed**, **2 skipped**
- `admin__e2e__document-view`: **41 failed**, **23 passed**
- `admin__e2e__list-view`: **34 failed**, **55 passed**

Overall: **128 failed / 108 passed / 2 skipped** (238 total).

## Failure Buckets (by feature area)

### `general` top failing groups

- `metadata` (17)
- `header actions` (9)
- `custom components` (6)
- `custom root views` (4)
- `theme` / `i18n` / `navigation` clusters also failing

### `document-view` top failing groups

- `custom fields` (14)
- `custom document views` (8)
- `drawers` (5)
- `API view` + custom menu/control related groups

### `list-view` top failing groups

- `table columns` (8)
- `list view custom components` (6)
- `formatDocURL` (5)
- `sorting` (5)
- `pagination` (4)

## Common Error Signatures

- Assertion timeouts (`Timeout: 6000ms`) and missing locators are dominant.
- Many visibility checks fail (`toBeVisible`).
- Multiple 20s test timeouts.
- One React runtime loop observed (`Maximum update depth exceeded`) in general CRUD modal flow.

## Next Fix Order (Leverage-First)

1. **Stabilize shared admin shell render path**

   - Focus: `general > metadata`, `header actions`, `custom components`, `custom root views`
   - Why first: these failures indicate top-level admin layout/composition mismatches that likely cascade into many downstream locator failures.

2. **Fix document route composition and custom field mounting**

   - Focus: `document-view > custom fields`, `custom document views`, `drawers`
   - Why second: document view is the core edit surface; repairing route/view composition here should clear a large contiguous failure set.

3. **Fix list-view state and preference synchronization**

   - Focus: `list-view > table columns`, `sorting`, `pagination`, `formatDocURL`
   - Why third: many list failures look like interaction state or URL/state sync drift rather than isolated component regressions.

4. **Address i18n/theme edge cases**

   - Focus: language switchers, translated labels, theme toggles
   - Why fourth: usually lower blast radius but still useful to verify adapter parity and context propagation.

5. **Investigate and fix React update loop**
   - Focus: general CRUD "leave-without-saving" modal flow (`Maximum update depth exceeded`)
   - Why now: isolated but high-risk runtime defect that can produce flaky follow-on behavior.

## Suggested Validation Slices

- After step 1: rerun `admin__e2e__general` with `--grep "metadata|header actions|custom components|custom root views"`.
- After step 2: rerun `admin__e2e__document-view`.
- After step 3: rerun `admin__e2e__list-view --grep "table columns|sorting|pagination|formatDocURL"`.
- After step 4/5: rerun full `admin__e2e__general`, then full admin matrix.

## RSC-Gated Test Rule

Tests that validate components not rendered when `isRSCEnabled` is false must be framework-gated (or disabled for TanStack) using the same pattern as `test/admin/e2e/document-view/e2e.spec.ts`.

Example:

```ts
test(
  'should show custom elements in document controls in collection',
  { framework: 'rsc' },
  async () => {
    // ...
  },
)
```

Reference pattern location:

```794:795:test/admin/e2e/document-view/e2e.spec.ts
      { framework: 'rsc' },
      async () => {
```
