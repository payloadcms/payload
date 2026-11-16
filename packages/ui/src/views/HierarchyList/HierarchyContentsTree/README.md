# Hierarchy contents tree

The built-in browser defaults to Tree for hierarchy containers configured with
`allowHasMany: false`, including folders and custom hierarchies. Explicit Table/Grid
preferences survive. Default multi-assignment tags retain All/By views; explicitly
single-assignment tags use the same contents capability with their configured labels
and icon. `nestedDocs` keeps its own collection tree. Custom List Components and
relationship drawers retain their existing paths and data. Legacy hierarchy URLs
continue to work; only the redundant built-in container By tab disappears.

`useHierarchyContentsTree` receives the authorized server `initialContents` snapshot.
Branches own independently paginated sources. IDs are deduplicated within a source,
so equal IDs in different collections remain distinct. Requests retain their original
snapshot and cannot update a replacement view or clear its newer request handles.
Abort signals suppress client updates; the server may already be running.

Container groups start collapsed, unassigned root groups expanded. Reopening cached
branches does not reload them. Type filters hide whole sources while keeping container
structure. Search uses the existing flat contents table. Source groups and their
records share indentation. Config labels use the translation utility; small icons,
connectors, pills, checkbox primitives, and table styling use shared components.

Explicit paging actions pass their DOM control to `loadMore`; automatic requests omit
it and cannot claim focus. The controller restores focus if a final footer disappears.
The renderer owns table relationships and loading/error announcements.

One header checkbox selects only loaded, visible, selectable real records across both
root sections. Source headings, pending rows, and footers are excluded. Explicit
selections survive collapse; select-all status ignores hidden selections. Deselect-all
clears only visible selections. Navigation, authoritative server snapshots, and authenticated-user changes start a
fresh selection origin. Local expansion and paging keep the same snapshot boundary. Other users’ locked records are excluded. Per-container allowed-type
metadata comes from that row’s authorized field, never the current parent hint. It is
advisory; bulk operations still authorize their own explicit IDs. Read-only selection
and bulk-action overrides remain effective.

Before/after List and table extensions render once around the complete browser; custom
list menu entries remain available. A root empty result may render the configured
NoResults extension; branch-local empty states stay within their connected rows.

Verify keyboard selection/expansion/paging/retry, source loading and cached reopen,
selection through collapse/navigation, mixed IDs and locks, custom restrictions/icons,
legacy URLs, explicit layouts, type/search filters, extension slots, and tag views.
Automated checks do not establish visual or screen-reader conformance. Verify focus,
connector alignment, RTL, reflow/text resize, target spacing, announcements, and
light/dark enhanced contrast in the integrated app (WCAG 1.1.1, 1.3.1–1.3.2,
1.4.3–1.4.4, 1.4.10–1.4.11, 2.1.1, 2.4.3–2.4.7, 2.4.11, 2.5.3, 2.5.8,
4.1.2–4.1.3).

The server resolves `hasContentsBrowser` for the built-in collection browser and
passes it through its headers, including Trash. Client tabs do not infer this from
the active view, so custom List overrides retain ownership and Trash cannot restore
the redundant By tab. This is a view prop, not a collection configuration option.
