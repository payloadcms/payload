import type { CollectionConfig } from '../collections/config/types.js'
import type { Field } from '../fields/config/types.js'
import type { GlobalConfig } from '../globals/config/types.js'

import { forkOnBranchUpdate, recordBranchCreate, stampBranchOnCreate } from './hooks.js'
import {
  branchDocIDField,
  branchField,
  branchOpField,
  branchParentField,
  MAIN_BRANCH,
} from './types.js'

const hidden = { admin: { disabled: { bulkEdit: true }, hidden: true } } as const

/**
 * `_branch` — which branch a row belongs to. `'main'` is a non-null sentinel
 * rather than NULL so that compound `(field, _branch)` unique indexes keep
 * enforcing uniqueness among main rows on Postgres, which treats NULLs as
 * distinct.
 */
export const buildBranchField = (): Field => ({
  name: branchField,
  type: 'text',
  ...hidden,
  defaultValue: MAIN_BRANCH,
  index: true,
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
  ...hidden,
  index: true,
  maxDepth: 0,
  relationTo: slug,
})

/** `_branchOp` — what this row represents on its branch. Null on main rows. */
export const buildBranchOpField = (): Field => ({
  name: branchOpField,
  type: 'text',
  ...hidden,
  index: true,
})

/** `_branchParent` — the canonical parent document, for version rows. */
export const buildBranchParentField = (slug: string): Field => ({
  name: branchParentField,
  type: 'relationship',
  ...hidden,
  index: true,
  maxDepth: 0,
  relationTo: slug,
})

const hasField = (fields: Field[], name: string): boolean =>
  fields.some((field) => 'name' in field && field.name === name)

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

  if (!hasField(collection.fields, branchOpField)) {
    collection.fields.push(buildBranchOpField())
  }

  const indexes = collection.indexes ?? []

  for (const field of collection.fields) {
    if ('name' in field && 'unique' in field && field.unique) {
      field.unique = false
      indexes.push({ fields: [field.name, branchField], unique: true })
    }
  }

  collection.indexes = indexes

  collection.hooks = collection.hooks ?? {}
  collection.hooks.beforeChange = [...(collection.hooks.beforeChange ?? []), stampBranchOnCreate]
  collection.hooks.afterChange = [...(collection.hooks.afterChange ?? []), recordBranchCreate]
  collection.hooks.beforeOperation = [
    ...(collection.hooks.beforeOperation ?? []),
    forkOnBranchUpdate,
  ]

  return collection
}

/**
 * Globals need only the discriminator.
 *
 * No `_branchDocID`, because a global's identity is its slug and is stable
 * across branches — the whole canonical-ID translation problem does not arise.
 * No `_branchOp`, because globals cannot be created or deleted through the API,
 * so there are no tombstones.
 */
export const injectGlobalBranchFields = (global: GlobalConfig): GlobalConfig => {
  if (!hasField(global.fields, branchField)) {
    global.fields.push(buildBranchField())
  }

  return global
}
