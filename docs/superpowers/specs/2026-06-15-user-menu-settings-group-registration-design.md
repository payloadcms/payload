# User Menu Settings Group Registration Design

## Goal

Support grouped registration for `admin.components.userMenuSettingsItems` so multiple plugins can register items under the same group label, while preserving full backward compatibility for existing flat registrations.

## Scope

1. Extend config shape for `userMenuSettingsItems` to support grouped entries.
2. Merge same-name groups at render time.
3. Keep legacy ungrouped entries working and display them in a default bottom group.
4. Ensure grouped entries are handled by import map generation.
5. Update plugin usage and tests for the new behavior.

## API Design

`userMenuSettingsItems` will accept a union:

- `CustomComponent` (existing shape)
- `{ group: string; items: CustomComponent[] }` (new grouped shape)

This preserves compatibility and enables explicit grouping. Plugins can register into a shared group by using the same `group` label.

## Runtime Normalization

In UI render path:

1. Iterate `userMenuSettingsItems`.
2. For grouped entries, append rendered items into a map keyed by `group`.
3. For ungrouped entries, append to a dedicated default group labeled `Other`.
4. Preserve registration order within each group.
5. Render grouped sections first and always render `Other` last (if it has items).

If there are no settings items, existing behavior remains unchanged.

## Import Map Integration

Update import-map iteration to include:

- direct `CustomComponent` entries
- each grouped entry’s `items` array

This ensures all grouped item components are available in admin import map resolution.

## Package-Level Changes

- `packages/payload/src/config/types.ts`
  - Add grouped entry type and update `userMenuSettingsItems` type union.
- `packages/payload/src/bin/generateImportMap/iterateConfig.ts`
  - Normalize and add grouped item components to import map.
- `packages/ui/src/templates/Default/index.tsx`
  - Normalize/merge/order grouped and ungrouped settings items before passing to header rendering.
- `packages/plugin-mcp/src/index.ts`
  - Register under a named group using the new grouped format.

## Testing Strategy

Add/adjust tests to verify:

1. Flat-only legacy registration still works.
2. Grouped registration renders with group labels.
3. Multiple grouped registrations with the same label merge into one group.
4. Ungrouped entries render under `Other` and appear after named groups.

## Error Handling and Edge Behavior

- Empty group item arrays are ignored.
- Unknown/invalid config types are rejected by type system.
- No silent fallback that changes behavior beyond the defined default-group handling.

## Rollout and Compatibility

This is additive and non-breaking:

- Existing configs using flat arrays continue to work.
- Plugin authors can opt into grouped registration incrementally.
