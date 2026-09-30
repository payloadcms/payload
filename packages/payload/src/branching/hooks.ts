import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  GlobalBeforeOperationHook,
} from '../index.js'

import { assertBranchWritable } from './assertBranchWritable.js'
import { resolveBranch } from './resolveBranch.js'
import { branchChangesCollectionSlug, branchField, branchOpField, MAIN_BRANCH } from './types.js'

/**
 * Stamps documents created on a branch so the read predicate can find them.
 *
 * `_branchDocID` is deliberately left null. For a document created on a branch
 * the canonical ID *is* the row's own ID, and the ID rewrite treats a null
 * `_branchDocID` as "self" — so setting it would mean an extra write after
 * insert to learn the generated ID, for no gain. Only forked rows, which point
 * at a different main row, need it populated.
 */
export const stampBranchOnCreate: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  const branch = resolveBranch(req)

  if (branch === MAIN_BRANCH || operation !== 'create') {
    return data
  }

  return {
    ...data,
    [branchField]: branch,
    [branchOpField]: 'create',
  }
}

/**
 * Records a branch-created document in the changeset registry.
 *
 * The registry is not consulted to *read* branch-created documents — those are
 * found by `_branch` alone. It exists so merge and the changed-documents view
 * can enumerate what a branch has done.
 */
export const recordBranchCreate: CollectionAfterChangeHook = async ({
  collection,
  doc,
  operation,
  req,
}) => {
  const branch = resolveBranch(req)

  if (branch === MAIN_BRANCH || operation !== 'create') {
    return doc
  }

  await assertBranchWritable({ branch, req })

  await req.payload.create({
    collection: branchChangesCollectionSlug,
    data: {
      branch,
      collectionSlug: collection.slug,
      doc: { relationTo: collection.slug, value: doc.id },
      entityType: 'collection',
      operation: 'create',
    },
    overrideAccess: true,
    req,
  })

  return doc
}

/** Refuses collection writes before they can make changes on a closed branch. */
export const assertBranchWritableBeforeCollectionWrite: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  if (operation !== 'create' && operation !== 'restoreVersion' && operation !== 'update') {
    return args
  }

  const branch = resolveBranch(req)

  if (branch === MAIN_BRANCH) {
    return args
  }

  await assertBranchWritable({ branch, req })

  return args
}

/** Refuses global writes before they can make changes on a closed branch. */
export const assertBranchWritableBeforeGlobalWrite: GlobalBeforeOperationHook = async ({
  args,
  global,
  operation,
  req,
}) => {
  if (operation !== 'restoreVersion' && operation !== 'update') {
    return args
  }

  const branch = resolveBranch(req)
  const branching = req.payload.config.branching

  if (
    branch === MAIN_BRANCH ||
    !branching?.enabled ||
    !branching.branchableGlobals.has(global.slug)
  ) {
    return args
  }

  await assertBranchWritable({ branch, req })

  return args
}
