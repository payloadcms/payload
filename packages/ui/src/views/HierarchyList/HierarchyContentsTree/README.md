# Hierarchy contents state

`useHierarchyContentsTree` receives an authorized `initialContents` snapshot and the container collection slug. Each container branch owns independently paginated collection sources. Document IDs are deduplicated within their source, so IDs shared by different collections remain distinct.

Changing the rendered snapshot resets visible state. Requests retain their originating snapshot and cannot update a replacement view or clear its newer request handles. Abort signals suppress client updates; the server function may already be running.

Opening a container loads its source summaries once. Its collection groups start collapsed; unassigned root groups start expanded. Reopening cached branches does not reload them. `loadMore({ parentID, source })` advances only that source.

The hook exposes a container ref for focus recovery when a paging control disappears. Explicit paging actions pass `control: event.currentTarget`; automatic loads omit it and cannot claim that control’s focus. The consuming table owns connectors, document actions, labels, row semantics, selection and loading/error announcements. Allowed-type metadata is advisory; mutations must authorize their own operations.

## Contents rendering

The hierarchy view offers an opt-in Tree layout for folders and custom single-assignment containers. It renders authorized `hierarchyData.contents`, keeps containers above document sources, and separates unassigned documents at the root. Related type groups start collapsed inside a container and expand at the same indentation as their documents. Type filters hide complete sources while keeping container structure. Search uses the existing flat hierarchy table.

The renderer uses configured translated labels and the hierarchy's small icon, shared decorative connectors, and real table headers. Explicit paging controls forward their DOM element to the controller for focus recovery. This slice does not change default routes, add selection controls, or remove the existing hierarchy tab.
