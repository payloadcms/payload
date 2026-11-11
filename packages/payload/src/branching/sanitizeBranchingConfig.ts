import {
  branchChangesCollectionSlug,
  branchesCollectionSlug,
  branchMergesCollectionSlug,
} from './types.js'

/**
 * Built-in Payload collections. Branching is off for these by default because
 * none of them hold authored content, but each can opt in with `branching: true`
 * — except collections that store branch state itself, which cannot be branched
 * at all (see `hardExcludedSlugs`).
 */
export const corePayloadCollectionSlugs = [
  'payload-jobs',
  'payload-kv',
  'payload-locked-documents',
  'payload-migrations',
  'payload-preferences',
  'payload-query-presets',
] as const

/**
 * Branching these is circular: resolving which documents are shadowed on a
 * branch would require already knowing the active branch in order to read the
 * registry that answers exactly that question.
 */
export const hardExcludedSlugs = [
  branchChangesCollectionSlug,
  branchesCollectionSlug,
  branchMergesCollectionSlug,
] as const
