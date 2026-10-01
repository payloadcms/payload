import type { Config } from '../config/types.js'
import type { SanitizedBranchingConfig } from './types.js'

import {
  branchChangesCollectionSlug,
  branchesCollectionSlug,
  branchMergesCollectionSlug,
} from './types.js'
import { defaultBranchMergeValidation } from './validation.js'

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

const DEFAULT_MAX_SHADOWED_IDS = 2000

/**
 * Resolves which collections and globals branching is active for.
 *
 * Must run during `sanitizeConfig` rather than per-collection sanitization,
 * and the ordering is load-bearing in both directions:
 *
 * - **after** the default-user-collection injection, or an auto-created `users`
 *   collection is missed;
 * - **before** the `sanitizeCollection` loop, which performs `_branch` field
 *   injection and unique-index rewriting and needs the resolved set.
 *
 * Plugins have already run by this point (`buildConfig` executes them before
 * `sanitizeConfig`), so plugin-added auth collections are included.
 */
export const sanitizeBranchingConfig = (config: Config): SanitizedBranchingConfig => {
  const incoming = config.branching
  const enabled = Boolean(incoming)

  const branching = typeof incoming === 'object' ? incoming : {}

  const disabled: SanitizedBranchingConfig = {
    branchableCollections: new Set<string>(),
    branchableGlobals: new Set<string>(),
    enabled: false,
    maxShadowedIDs: branching.maxShadowedIDs ?? DEFAULT_MAX_SHADOWED_IDS,
    validate: branching.validate ?? defaultBranchMergeValidation,
  }

  if (!enabled) {
    return disabled
  }

  const isMultiTenantPluginEnabled = config.plugins?.some(
    (plugin) =>
      plugin.slug === '@payloadcms/plugin-multi-tenant' && plugin.options?.enabled !== false,
  )

  if (isMultiTenantPluginEnabled) {
    console.warn(
      '[Payload] Content branching and @payloadcms/plugin-multi-tenant are enabled together. This combination is not supported and does not provide tenant isolation.',
    )
  }

  const explicitlyExcluded = new Set<string>(branching.exclude ?? [])
  const offByDefault = new Set<string>(corePayloadCollectionSlugs)

  // The KV collection's slug is configurable, so the literal above only covers
  // the default. Branching it is meaningless — it is a key-value store, not
  // content — and actively harmful: its `key` is unique, so the rewrite turns
  // that into a branch-scoped compound index, and `ensureIndexes` then refuses to
  // reconcile it against a database that already has the unique one. That fails
  // at connect time, which takes the whole instance down rather than degrading.
  const kvCollectionSlug = config.kv?.kvCollection?.slug

  if (kvCollectionSlug) {
    offByDefault.add(kvCollectionSlug)
  }

  const branchableCollections = new Set<string>()

  for (const collection of config.collections ?? []) {
    const { slug } = collection

    if ((hardExcludedSlugs as readonly string[]).includes(slug)) {
      if (collection.branching === true) {
        throw new Error(
          `Collection "${slug}" stores branch state and cannot itself be branched. Remove \`branching: true\` from it.`,
        )
      }
      continue
    }

    if (collection.auth) {
      if (collection.branching === true) {
        throw new Error(
          `Collection "${slug}" has authentication enabled and cannot be branched. Remove \`branching: true\` from it.`,
        )
      }
      continue
    }

    if (explicitlyExcluded.has(slug) || collection.branching === false) {
      continue
    }

    if (offByDefault.has(slug) && collection.branching !== true) {
      continue
    }

    branchableCollections.add(slug)
  }

  const branchableGlobals = new Set<string>()

  for (const global of config.globals ?? []) {
    if (explicitlyExcluded.has(global.slug) || global.branching === false) {
      continue
    }

    branchableGlobals.add(global.slug)
  }

  return {
    access: branching.access,
    branchableCollections,
    branchableGlobals,
    enabled: true,
    hooks: branching.hooks,
    maxShadowedIDs: branching.maxShadowedIDs ?? DEFAULT_MAX_SHADOWED_IDS,
    validate: branching.validate ?? defaultBranchMergeValidation,
  }
}
