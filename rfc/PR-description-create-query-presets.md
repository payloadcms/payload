# Editable Query Presets (decoupled from List View)

There is no idiomatic way to edit where/columns/groupBy in a generic form—today preset documents are filled by building the query in the List View and saving; the preset form’s Field components are read-only.

**Scope of this PR:** Change the admin components for `payload-query-presets` so presets can be created and edited directly in the document form (where, columns, groupBy), without depending on the list view. The builders would receive the field value and `relatedCollection` (or equivalent collection context) instead of `useListQuery()`.

**Why:** This is needed for future work (e.g. Widgets) and potentially other features like the Email Marketing plugin.
