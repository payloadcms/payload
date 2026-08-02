# fix(ui): re-sync where builder inputs when the list query changes externally

Reported against Payload `3.84.1` (`@payloadcms/ui` 3.84.1, Next 15.4.10, React 19.1.4,
`@payloadcms/db-mongodb`).

> In the Admin UI List View, select a Query Preset, change a filter value, then click Reset. The
> list refetches and the URL search params update correctly, but the Filter UI inputs still show
> the modified values. Only a hard reload fixes it.

Confirmed. The reset itself works; only the filter inputs are stale.

## Defect: `Condition` never re-reads its `value` prop after mount

`packages/ui/src/elements/WhereBuilder/Condition/index.tsx` mirrors its `value` prop into local
state so the input can be debounced before it writes back to the query:

```ts
const [internalValue, setInternalValue] = useState<Value>(value)
const debouncedValue = useDebounce(internalValue, 300)
```

`useState(value)` seeds state on the **first render only**. The input renders
`value={internalValue ?? ''}`, and nothing ever assigns `internalValue` from the `value` prop
again. Any query change that does not originate from this input is invisible to it.

The reset path is otherwise correct end to end. `QueryPresetBar`'s `#reset-preset` button calls
`refineListData({ columns, groupBy, where: activePreset.where }, false)`, which merges the query,
pushes the new search string, and calls `setQuery`. `WhereBuilder` re-derives `conditions` from
`listQuery.query?.where` on every render and passes the correct `value` down. It arrives at a
component that ignores it.

### Why the repo could not see it

The component has always depended on **remount** rather than prop sync, and that remount is
incidental. `WhereBuilder` keys its or-groups by shape:

```ts
// packages/ui/src/elements/WhereBuilder/index.tsx:181
const compoundOrKey = `${orIndex}_${Array.isArray(or?.and) ? or.and.length : ''}`
```

Adding or removing a condition changes `and.length`, the key changes, React unmounts the subtree,
and the fresh `Condition` re-runs `useState(value)` with correct data. That is why
`should still show second filter if two filters exist and first filter is removed`
(`test/admin/e2e/list-view/e2e.spec.ts:787`) passes today - not because state syncs, but because
the component is thrown away and rebuilt.

That key encodes only the _shape_ of the where query, never its _values_. A preset reset replaces
values while leaving `orIndex` at 0 and `and.length` at 1. No key change, no remount, stale state.

## The fix

```ts
/**
 * Re-sync the input when the query changes from outside this condition, e.g. a query preset is
 * selected or reset. `WhereBuilder` keys conditions by their position and by `and.length`, so it
 * only remounts them when the *shape* of the query changes. A change that replaces values while
 * keeping the shape leaves this component mounted, and without this its state goes stale.
 */
useEffect(() => {
  setInternalValue(value)
}, [value])
```

Ten lines, one file. No change to `WhereBuilder`'s keying: it is still load-bearing for add and
remove, and narrowing it was out of scope.

### An earlier, larger version was rejected on evidence

The first draft tracked the last value the condition emitted in a ref and only re-synced when the
incoming prop differed from it, on the theory that the debounced round trip could otherwise clobber
characters typed while a query update was in flight. That reasoning is wrong, and testing showed
it:

- `useDebounce` is **trailing-edge**. It resets its timer on every keystroke, so it never fires
  mid-typing. Typing 24 characters at 80ms intervals produces exactly one query update, after the
  typing stops.
- `refineListData` (`packages/ui/src/providers/ListQuery/index.tsx:61`) calls `setQuery(newQuery)`
  **synchronously**. `router.replace` is fired inside `startRouteTransition` but nothing awaits it,
  so the `value` prop updates in the same tick the debounce fires. There is no in-flight window.

Two attempts to construct a failing case for the guard - 1.9s of continuous typing, and typing
resumed 320ms after a pause to land inside a supposed round trip - both passed **without** it,
three runs each. The guard was 16 lines defending against a race the architecture makes
impossible, so it was cut.

## Result

Both reported steps now behave correctly without a reload: the filter input follows the query on
preset reset and on preset selection.

## Why the tests missed it

1. **Every existing where-builder test drives the UI in a direction that cannot expose it.** Tests
   either type into the input and assert the URL or table (`list-view/e2e.spec.ts:738`, `:760`), or
   they `page.goto('?where=...')` and assert the input (`:591`, `:608`, `:634`). The second group is
   URL to UI, but always on a **fresh mount**, where the `useState` initialiser is correct by
   construction. No test exercised URL to UI against an **already-mounted** builder, which is the
   only situation where `internalValue` can drift.

2. **The preset reset tests deliberately assert on everything except the where builder.**
   `should reset active changes` (`query-presets/e2e.spec.ts:304`) modifies columns and asserts a
   column pill. `should reset groupBy when clicking reset button on modified preset` (`:732`)
   modifies groupBy and asserts the URL plus group headers. Both `ListControls` columns and groupBy
   read straight from `useListQuery()` with no local mirror, so they could never have caught this.
   `where` is the only reset-able part of the query with a debounced local copy, and it was the one
   part never asserted after a reset.

3. **One passing test looked like coverage and was not.** As above,
   `should still show second filter...` (`list-view/e2e.spec.ts:787`) does assert an input value
   after an in-page query change, which reads as prop-sync coverage. It is really remount coverage.
   A reviewer scanning the suite would reasonably conclude this surface was tested.

4. **There is no React component test harness in the repo.** `package.json:113` chains
   `pnpm test:components`, but no such script is defined, and `vitest.config.ts` declares only
   `unit`, `int` and `eval` projects, all `environment: 'node'`. A three-line prop-sync regression
   has no cheap home; e2e is the only place it can be caught at all.

## Test coverage added

Both in `test/query-presets/e2e.spec.ts`, both verified to fail without the fix.

| Test                                                                       | What it guards                                                                                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `should reset filter inputs when clicking reset button on modified preset` | The reported path. Asserts the URL resets **and** the input follows, so a fix that only repairs the query cannot pass it.                                    |
| `should overwrite existing filter inputs when selecting a preset`          | The other entry point into the same root cause - `handlePresetChange` rather than reset. A user filter is replaced by a preset's filter with the same shape. |

The second matters because a future change could plausibly special-case the reset button and leave
preset selection broken. Both go through `refineListData`, and both are covered.

No test was added for the trailing-edge debounce reasoning, because no test could distinguish it -
see the rejected-guard section above. Adding one would have been ceremony.

## Verification

Run against a dev server on the affected suites, MongoDB via `pnpm docker:start` (mongodb profile).

| Check                                                 | Result                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------ |
| Both new tests, fix stashed                           | **2 failed** - `Received: "modified value"`, `Received: "my own filter"` |
| Both new tests, fix applied                           | **2 passed**                                                             |
| `test/query-presets/e2e.spec.ts` (full)               | **26 passed**, 2 pre-existing skips                                      |
| `test/admin/e2e/list-view/e2e.spec.ts --grep filters` | **24 passed**                                                            |
| `packages/ui` `tsc --noEmit`                          | 0 errors                                                                 |
| `packages/next` `tsc --noEmit`                        | 0 errors                                                                 |
| ESLint on changed files                               | no new errors                                                            |

The admin filters block is the meaningful regression signal here: it contains the debounce and
typing tests (`should not re-render page upon typing in a value in the filter value field`,
`should show all documents when equals filter value is cleared`,
`should reset filter value when a different field is selected`,
`should reset filter values for every additional filter`) that a bad prop-sync would break.

### Not verified

- **`pnpm build:core` / `build:ui` do not complete.** `packages/payload` fails with three
  `sloppyRanges does not exist in type 'CronOptions | CronCallback'` errors from croner typings
  (`src/bin/index.ts:47`, `src/index.ts:766`, `src/queues/operations/handleSchedules/index.ts:146`).
  Pre-existing and unrelated; confirmed absent from this diff. `packages/ui` and `packages/next`
  were typechecked directly with `tsc --noEmit` instead.
- **Only chromium.** The Playwright config's other projects were not run.
- **No integration or unit suites were run.** This change is client-only React state with no
  server-side surface.
- **Postgres and SQLite adapters not exercised.** The bug is in `@payloadcms/ui` and is
  adapter-independent, but only MongoDB was actually run.
- **Only the `text`/`equals` filter input was exercised end to end.** `DefaultFilter` also routes
  to `DateFilter`, `NumberFilter`, `RelationshipFilter` and `Select`. They receive the same
  `internalValue` and so are fixed by the same line, but no test drives a preset reset against a
  relationship or date filter specifically.

## Notes for review

- **`WhereBuilder`'s `compoundOrKey` was left alone deliberately.** With prop sync in place it is
  no longer the only mechanism keeping conditions correct, and it could arguably be simplified to a
  stable key. It still does real work for add and remove, and changing it would widen the blast
  radius well past the reported bug.
- **`handleFieldChange` and `handleOperatorChange` call `setInternalValue(undefined)` directly.**
  Traced against the new effect: in both cases the next `value` prop is `undefined` too, so the
  effect either no-ops or re-applies `undefined`. No double-render, no fight between the two.
- **`Text/index.tsx` already syncs its own `valueToRender` state from `value` via an effect** for
  the `in`/`not_in` multi-value path. The fix applies the same pattern one level up, so the two are
  now consistent rather than one compensating for the other.
- **`ListQuery`'s `syncPropsToURL` effect** merges server props over local query state and could in
  principle deliver a stale `where`. Not touched, not observed, and orthogonal to this bug - but it
  is the other place query state can move without user input, and worth a look if similar reports
  appear.
- **Open question:** whether `Condition` should own debounced state at all, or whether debouncing
  belongs in `ListQuery` so every consumer of the query gets one source of truth. That is a larger
  refactor and not something a bug fix should decide.
