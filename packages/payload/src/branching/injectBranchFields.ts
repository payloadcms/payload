import type { CollectionConfig, CompoundIndex } from '../collections/config/types.js'
import type { Field, TextField } from '../fields/config/types.js'
import type { GlobalConfig } from '../globals/config/types.js'

import { fieldAffectsData, tabHasName } from '../fields/config/types.js'
import {
  assertBranchWritableBeforeCollectionWrite,
  assertBranchWritableBeforeGlobalWrite,
  recordBranchCreate,
  stampBranchOnCreate,
} from './hooks.js'
import { branchDocIDField, branchField, branchParentField, MAIN_BRANCH } from './types.js'

/**
 * These columns are branch bookkeeping, not content. They are `admin.hidden`,
 * but hidden is not the same as read-only: the admin form round-trips every
 * field it loaded, so an edit made on a branch would submit the `_branch` it
 * was read with and stamp it back onto the shadow row — quietly moving that
 * row onto `main` and duplicating the document in production.
 *
 * Denying field-level create/update makes them internally writable only.
 * Field access is skipped under `overrideAccess: true`, which is exactly the
 * exemption merge needs to flip `_branch` to `'main'` (§16), and the
 * copy-on-write paths write through `payload.db` directly, below field access
 * entirely.
 */
const internalOnly = {
  access: { create: () => false, update: () => false },
  admin: { disabled: { bulkEdit: true }, hidden: true },
} as const

/**
 * `hidden` on top of that, for the columns nothing outside the branching engine
 * ever reads back.
 *
 * `admin.hidden` only keeps a field out of the edit form — it still ships in every
 * API response, which muddies the shape of every branched document. `hidden`
 * removes it from responses altogether. Reads that legitimately need to inspect
 * these columns pass `showHiddenFields: true`; the engine itself is unaffected,
 * because copy-on-write, merge and tombstoning all read through `payload.db`
 * directly, below the `afterRead` layer that does the stripping.
 *
 * Writes must never take these from round-tripped data: a read strips them, the
 * field default silently refills `_branch` with `main`, and writing that back
 * would flip a branch's row onto main. Both adapters set `_branch` explicitly on
 * global writes for exactly this reason.
 */
const bookkeepingOnly = {
  ...internalOnly,
  hidden: true,
} as const

/**
 * `_branch` — which branch a row belongs to. `'main'` is a non-null sentinel
 * rather than NULL so that compound `(field, _branch)` unique indexes keep
 * enforcing uniqueness among main rows on Postgres, which treats NULLs as
 * distinct.
 */
export const buildBranchField = (): TextField => ({
  name: branchField,
  type: 'text',
  ...bookkeepingOnly,
  defaultValue: MAIN_BRANCH,
  index: true,
  label: 'Branch',
  required: true,
})

/**
 * `_branchDocID` — the canonical document this row represents. Null on main
 * rows, meaning "self".
 *
 * Declared as a self-referential `relationship` rather than `text` for two
 * reasons: it inherits the collection's own ID type (which may be text,
 * number, or a custom ID), and Payload's Drizzle builder special-cases
 * `not_in` for relationship fields to emit `(col NOT IN (...) OR col IS NULL)`,
 * without which every main row would be excluded from a branch read.
 */
export const buildBranchDocIDField = (slug: string): Field => ({
  name: branchDocIDField,
  type: 'relationship',
  ...bookkeepingOnly,
  index: true,
  label: 'Branch Document',
  maxDepth: 0,
  relationTo: slug,
})

/** `_branchParent` — the canonical parent document, for version rows. */
export const buildBranchParentField = (slug: string): Field => ({
  name: branchParentField,
  type: 'relationship',
  ...bookkeepingOnly,
  index: true,
  label: 'Branch Parent Document',
  maxDepth: 0,
  relationTo: slug,
})

const hasField = (fields: Field[], name: string): boolean =>
  fields.some((field) => 'name' in field && field.name === name)

const joinFieldPath = ({ name, parentPath }: { name: string; parentPath: string }): string =>
  parentPath ? `${parentPath}.${name}` : name

const rewriteUniqueFields = ({
  fields,
  indexes,
  parentPath = '',
}: {
  fields: Field[]
  indexes: CompoundIndex[]
  parentPath?: string
}): void => {
  for (const field of fields) {
    if (fieldAffectsData(field) && 'unique' in field && field.unique) {
      const fieldPath = joinFieldPath({ name: field.name, parentPath })

      field.unique = false
      indexes.push({
        fields: [fieldPath, branchField],
        ...(field.required === true ? {} : { requireExists: [fieldPath] }),
        unique: true,
      })
    }

    if (field.type === 'collapsible' || field.type === 'group' || field.type === 'row') {
      rewriteUniqueFields({
        fields: field.fields,
        indexes,
        parentPath:
          field.type === 'group' && fieldAffectsData(field)
            ? joinFieldPath({ name: field.name, parentPath })
            : parentPath,
      })
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        rewriteUniqueFields({
          fields: tab.fields,
          indexes,
          parentPath: tabHasName(tab) ? joinFieldPath({ name: tab.name, parentPath }) : parentPath,
        })
      }
    }
  }
}

/**
 * Injects the branch discriminator fields and rewrites `unique: true` fields
 * into branch-scoped compound indexes.
 *
 * A branch holds a full copy of a document, so an unscoped unique index would
 * reject the copy outright. Scoping by `_branch` lets two branches each hold a
 * document with the same value while preserving uniqueness within a branch.
 */
export const injectBranchFields = (collection: CollectionConfig): CollectionConfig => {
  if (!hasField(collection.fields, branchField)) {
    collection.fields.push(buildBranchField())
  }

  if (!hasField(collection.fields, branchDocIDField)) {
    collection.fields.push(buildBranchDocIDField(collection.slug))
  }

  const indexes = (collection.indexes ?? []).map((index) =>
    index.unique && !index.fields.includes(branchField)
      ? { ...index, fields: [...index.fields, branchField] }
      : index,
  )

  // Catches two concurrent first-edits of the same document on the same branch:
  // whichever write loses the race gets a constraint violation from the
  // database instead of a second, silently duplicate shadow row. Scoped to rows
  // that have a `_branchDocID` at all — a main row's is null, and a unique
  // index would otherwise treat every main row as colliding with every other.
  indexes.push({
    fields: [branchDocIDField, branchField],
    requireExists: [branchDocIDField],
    unique: true,
  })

  rewriteUniqueFields({ fields: collection.fields, indexes })

  collection.indexes = indexes

  // `filename` is unique on upload collections, but it is added by upload
  // sanitization — which runs *after* this — so the loop above cannot reach it and
  // it would keep a global unique index. A branch's copy of an upload then
  // collides with main's on filename, and forking or tombstoning it fails
  // outright. Declaring the compound index up front is the supported way to scope
  // it: `getBaseUploadFields` leaves `filename.unique` unset when it is present.
  if (collection.upload) {
    const upload = collection.upload === true ? {} : collection.upload

    upload.filenameCompoundIndex ??= ['filename']

    if (!upload.filenameCompoundIndex.includes(branchField)) {
      upload.filenameCompoundIndex.push(branchField)
    }

    collection.upload = upload
  }

  collection.hooks = collection.hooks ?? {}
  collection.hooks.beforeChange = [...(collection.hooks.beforeChange ?? []), stampBranchOnCreate]
  collection.hooks.afterChange = [...(collection.hooks.afterChange ?? []), recordBranchCreate]
  collection.hooks.beforeOperation = [
    assertBranchWritableBeforeCollectionWrite,
    ...(collection.hooks.beforeOperation ?? []),
  ]

  return collection
}

/**
 * Globals need only the discriminator.
 *
 * No `_branchDocID`, because a global's identity is its slug and is stable
 * across branches — the whole canonical-ID translation problem does not arise.
 */
export const injectGlobalBranchFields = (global: GlobalConfig): GlobalConfig => {
  if (!hasField(global.fields, branchField)) {
    // Each global has at most one row on a branch. Besides expressing that
    // invariant, the unique key is the conflict target used by adapter upserts
    // when concurrent requests make the first branch write.
    global.fields.push({ ...buildBranchField(), unique: true })
  }

  global.hooks = global.hooks ?? {}
  global.hooks.beforeOperation = [
    assertBranchWritableBeforeGlobalWrite,
    ...(global.hooks.beforeOperation ?? []),
  ]

  return global
}
