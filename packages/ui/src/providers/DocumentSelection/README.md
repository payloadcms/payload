# Incremental document selection

`selectionScopeKey` opts the provider into incremental selection. Omit it to keep
existing table/grid behavior, including resetting selection when `collectionData`
changes. Change the scope when navigating to a different collection or container.

An opted-in child calls the stable optional `registerVisibleDocuments({ documents })`
with a memoized complete snapshot of visible, loaded, real document rows:

```ts
{ collectionSlug, document: { id, _isLocked, _userEditing }, metadata: { allowedCollections } }
```

Use each container document’s own allowed types. Omit unavailable metadata rather
than treating it as an unrestricted empty array. Registration wrappers keep metadata
separate from arbitrary CMS fields. Group headings, pending rows, and footers do not
register as documents.

Registration replaces visibility while retaining known documents and explicit
selections. Select-all selects or deselects only currently visible selectable rows;
its status excludes hidden selections. Single selection rejects unknown or hidden
unselected records. Collapse retains selected records and their metadata. Refreshed
visible records replace selected metadata and remove selections now locked by other
users. Each navigation transition starts a fresh selection origin immediately, including
returning to a previously visited scope; callbacks from earlier origins are ignored.
Registered row metadata is authoritative in incremental mode, including absence.

This is client selection state, not authorization. Bulk operations still enforce
normal server-side collection, document, and field access.
