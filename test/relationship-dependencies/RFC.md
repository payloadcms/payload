Hello everyone, we would like to improve behaviors that happen when related documents are deleted. We would appreciate your feedback on what you would like to see in a feature that addresses this data integrity behavior currently in Payload.

## Background

When a document is deleted, any other documents that **reference** it (via relationship or upload fields) are left in an inconsistent state: they keep the ID of the deleted document, so the relationship is "stale."

On SQL backends, if that relationship is **required**, deleting the referenced document can trigger a database constraint error instead of succeeding, because the schema currently uses `ON DELETE SET NULL` on a column that is `NOT NULL`.

This RFC focuses on **configurable behavior when the referenced document is deleted** — i.e. what happens to the **referring** documents (cascade, set null, or restrict). It is related to but distinct from the **dependency tree UI** (showing what references a document, or what a document references), which is covered in [Discussion #2938](https://github.com/payloadcms/payload/discussions/2938) and the design in [Discussion #3217](https://github.com/payloadcms/payload/discussions/3217).

## The problem

### 1. Stale references (all databases)

Today, when you delete a document that is referenced by another document (e.g. delete a User that is the `author` of a Post), the referring document is **not** updated. The relationship field still holds the deleted document's ID. There is no built-in option to:

- **Set null** — clear the reference so the referrer stays valid with no relationship.
- **Cascade** — delete (or otherwise handle) the referring documents.
- **Restrict** — block the delete if any referrers exist (and optionally warn in the UI).

### 2. Constraint violation on required relations (SQL)

When a relationship field is **required** and the backend is SQL (e.g. Postgres), the generated schema uses `ON DELETE SET NULL` for the foreign key but the column is `NOT NULL`. Deleting the referenced document causes the database to attempt SET NULL, which violates the constraint. Users see an error such as:

```
null value in column "user_id" of relation "comments" violates not-null constraint
```

This is reported in [Issue #11177](https://github.com/payloadcms/payload/issues/11177) (24+ upvotes). There is no way in Payload config to set `onDelete` (or `onUpdate`) behavior per relationship field.

## Related work

| Link                                                                       | Summary                                                                                                                                                        |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Discussion #2938](https://github.com/payloadcms/payload/discussions/2938) | Dependency tree **UI**: show relationships TO a document (referrers) and ON a document (what it references). Enables warnings before delete and cache purging. |
| [Discussion #3217](https://github.com/payloadcms/payload/discussions/3217) | Admin 2.0 design: Relationships view and References view.                                                                                                      |
| [PR #1209](https://github.com/payloadcms/payload/pull/1209)                | WIP: add cascade feature to relationships. Closed; "right idea, wrong level of abstraction."                                                                   |
| [Issue #11177](https://github.com/payloadcms/payload/issues/11177)         | Foreign keys with cascade delete: request for configurable `onDelete` / `onUpdate` and better UX when delete is blocked.                                       |

## Current behavior (codebase)

- **Delete operation** (`packages/payload`): Does not find or update documents in other collections that reference the deleted document. Versions, preferences, and associated files are cleaned up; referrers are not.
- **Drizzle schema** (`packages/drizzle`): For simple relationship/upload fields, the FK is built with a **hardcoded** `onDelete: 'set null'`. If the field is `required`, the column is also `notNull: true`, which conflicts with SET NULL when the referenced row is deleted.
- **Existing pattern**: The folders plugin uses an `afterDelete` hook (`dissasociateAfterDelete`) to set the folder reference to `null` on referring documents. That is an application-level "set null" pattern.

## Proposal

Introduce **configurable behavior when the referenced document is deleted** (and optionally on update), so that:

1. Required relationships on SQL no longer produce an invalid schema (SET NULL + NOT NULL).
2. Users can choose per relationship (or upload) field: **restrict** (block delete if referrers exist), **set null** (clear the reference in app and/or DB), or **cascade** (delete or update referrers, with hooks running if done in app).
3. The dependency-tree UI (#2938 / #3217) can later use the same "who references this document" information to warn users before delete.

Other possible implementation directions:

- **DB-level**: Add `onDelete` / `onUpdate` to the relationship (and upload) field config; pass them through to the Drizzle (and other DB adapters) schema. For `required: true` + `onDelete: 'set null'`, either disallow the combination or make the column nullable when the referenced row is deleted.
- **App-level**: Before or after `db.deleteOne`, find referrers (e.g. via a registry or generic query) and, based on field config, update (set null) or delete them via Payload so hooks and access control run. DB FKs could be RESTRICT or omitted to avoid double behavior.
- **Hybrid**: DB uses RESTRICT or a safe default; application performs "set null" or "cascade" when configured, so Payload hooks always run and the database never silently SET NULL on a NOT NULL column.

Example (illustrative) API shape for field config:

```ts
{
  name: 'author',
  type: 'relationship',
  relationTo: 'users',
  required: true,
  onDelete: 'restrict',  // or 'set null' | 'cascade'
  onUpdate: 'cascade',  // optional
}
```

Semantics (e.g. whether `cascade` means "delete referrers" or "clear reference" for polymorphic relations) would need to be defined.

## Open questions

1. Should `onDelete` / `onUpdate` be **field-level** (per relationship/upload) or also configurable at collection level?
2. For **cascade**: should we delete referrers via Payload (so hooks run) or rely on DB CASCADE (simpler but no hooks)? (See [comment in #11177](https://github.com/payloadcms/payload/issues/11177) on DB CASCADE not triggering hooks.)
3. How do we handle **polymorphic** relationships (`relationTo: ['posts', 'media']`) and **block** fields that contain relationships?
4. Should **restrict** block the delete at the API level (with a clear error) and optionally power a UI warning ("X documents reference this; remove references or allow cascade")?
5. Backward compatibility: what is the default when `onDelete` is omitted — `set null` (current DB behavior for optional) or `restrict` to avoid accidental data loss?

## How to give feedback

- Reply in this discussion with use cases, preferences (DB vs app-level vs hybrid), or constraints (e.g. MongoDB has no FKs).
- If you have implemented workarounds (e.g. `afterSchemaInit` to change FKs, or `beforeDelete` hooks to cascade), sharing them would help inform the design.
