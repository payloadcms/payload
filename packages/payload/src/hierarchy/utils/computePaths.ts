import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../types/index.js'
import type { ComputePathsResult } from './computePaths/types.js'

import { slugify as defaultSlugify } from '../../utilities/slugify.js'
import { buildDocumentPaths } from './computePaths/buildDocumentPaths.js'
import { fetchParentDocument } from './computePaths/fetchParentDocument.js'
import { buildBasePathsForDocument, getTitleValue } from './computePaths/valueResolvers.js'
import { findFieldByName, findUseAsTitleField } from './findUseAsTitle.js'

type ComputePathsArgs = {
  collection: SanitizedCollectionConfig
  doc: Document
  draft?: boolean
  locale?: string
  parentFieldName: string
  req: PayloadRequest
  slugPathFieldName: string
  titleFieldName?: string
  titlePathFieldName: string
}

/**
 * Computes both slug and title breadcrumb paths for a document by walking up the parent chain.
 * More efficient than computing them separately since it only walks the chain once.
 *
 * Note: Ancestor fetches always use `overrideAccess: true` to ensure paths are complete.
 * If a user can read a document, they should see its full breadcrumb path even if they
 * cannot read all ancestor documents. This prevents broken breadcrumbs and provides
 * better UX at the cost of minimal information leakage (ancestor titles in paths).
 *
 * @param args - Configuration for path computation
 * @returns Object with slugPath and titlePath
 */
export async function computePaths(args: ComputePathsArgs): Promise<ComputePathsResult> {
  const {
    collection,
    doc,
    draft = false,
    locale,
    parentFieldName,
    req,
    slugPathFieldName,
    titleFieldName: titleFieldNameArg,
    titlePathFieldName,
  } = args

  const hierarchyConfig = collection.hierarchy
  if (hierarchyConfig === false) {
    throw new Error(`Collection "${collection.slug}" does not have hierarchy enabled`)
  }

  const slugify = hierarchyConfig.slugify || ((text: string) => defaultSlugify(text) || '')
  const titlePathSeparator = hierarchyConfig.titlePathSeparator
  const titleFieldNameToUse = titleFieldNameArg ?? hierarchyConfig.titleField
  const titleFieldInfo = titleFieldNameToUse
    ? findFieldByName(collection, titleFieldNameToUse)
    : findUseAsTitleField(collection)

  if (!titleFieldInfo) {
    throw new Error(
      `The hierarchy title field "${titleFieldNameToUse}" was not found in collection "${collection.slug}"`,
    )
  }

  const { localized: isTitleLocalized, titleFieldName } = titleFieldInfo

  const slugFieldName = hierarchyConfig.slugField
  const slugFieldInfo = slugFieldName ? findFieldByName(collection, slugFieldName) : undefined
  const isSlugLocalized = slugFieldInfo?.localized ?? false

  // Initialize cache if it doesn't exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context = req.context as any
  if (!context.hierarchyAncestorCache) {
    context.hierarchyAncestorCache = {}
  }
  if (!context.hierarchyAncestorCache[collection.slug]) {
    context.hierarchyAncestorCache[collection.slug] = {}
  }

  // Initialize cache stats if debug is enabled
  if (req.payload.config.debug && !context.hierarchyCacheStats) {
    context.hierarchyCacheStats = {
      hits: 0,
      misses: 0,
      queries: 0,
    }
  }

  const parentValue = doc[parentFieldName]
  let parentID: number | string | undefined
  const populatedParent =
    parentValue && typeof parentValue === 'object' && 'id' in parentValue ? parentValue : undefined

  if (!parentValue) {
    // No parent - root document
    parentID = undefined
  } else {
    // Extract ID from parent value
    // Parent can be:
    // - Plain ID (string/number)
    // - Populated object with { id: ... }
    if (typeof parentValue === 'object' && 'id' in parentValue) {
      parentID = parentValue.id
    } else {
      parentID = parentValue as number | string
    }
  }

  if (parentID) {
    if (context.hierarchyCacheStats) {
      context.hierarchyCacheStats.misses += 1
      context.hierarchyCacheStats.queries += 1
    }

    const populatedParentHasPaths =
      populatedParent &&
      populatedParent[slugPathFieldName] !== undefined &&
      populatedParent[titlePathFieldName] !== undefined

    // Initialize cache for parent collection if needed
    if (!context.hierarchyAncestorCache[collection.slug]) {
      context.hierarchyAncestorCache[collection.slug] = {}
    }

    const cache = context.hierarchyAncestorCache[collection.slug]
    const cacheKey = `${parentID}_${locale || 'default'}_${draft ? 'draft' : 'published'}`

    // Check cache first
    let parent = (populatedParentHasPaths ? populatedParent : undefined) || cache[cacheKey]

    if (parent) {
      // Cache hit
      if (context.hierarchyCacheStats) {
        if (parent === populatedParent && !cache[cacheKey]) {
          context.hierarchyCacheStats.misses += 1
          context.hierarchyCacheStats.queries += 1
        } else {
          context.hierarchyCacheStats.hits += 1
        }
      }
    } else {
      // Cache miss - fetch parent
      if (context.hierarchyCacheStats) {
        context.hierarchyCacheStats.misses += 1
        context.hierarchyCacheStats.queries += 1
      }

      try {
        parent = await fetchParentDocument({
          collection,
          draft,
          locale,
          parentFieldName: hierarchyConfig.parentFieldName,
          parentID,
          req,
          slugFieldName,
          slugify,
          slugPathFieldName,
          titleFieldName,
          titlePathFieldName,
        })

        // Store in cache
        cache[cacheKey] = parent
      } catch {
        // If we can't fetch the parent at all (even with fallbacks), treat this as a root document
        // This can happen with complex draft/locale combinations
        parentID = undefined
      }
    }

    // If parent fetch failed, treat as root document
    if (!parentID || !parent) {
      return buildBasePathsForDocument({
        document: doc,
        isSlugLocalized,
        isTitleLocalized,
        locale,
        req,
        slugFieldName,
        slugify,
        titleFieldName,
      })
    }

    const currentDocCacheKey = `${doc.id}_${locale || 'default'}_${draft ? 'draft' : 'published'}`
    if (!context.hierarchyAncestorCache[collection.slug]) {
      context.hierarchyAncestorCache[collection.slug] = {}
    }

    context.hierarchyAncestorCache[collection.slug][currentDocCacheKey] = {
      [parentFieldName]: parentID,
      [titleFieldName]: getTitleValue({
        document: doc,
        isTitleLocalized,
        locale,
        req,
        titleFieldName,
      }),
    }

    return await buildDocumentPaths({
      collection,
      context,
      currentDocCacheKey,
      doc,
      draft,
      isSlugLocalized,
      isTitleLocalized,
      locale,
      parent,
      parentFieldName: hierarchyConfig.parentFieldName,
      req,
      resolveParentPaths: async () =>
        await computePaths({
          collection,
          doc: parent,
          draft,
          locale,
          parentFieldName: hierarchyConfig.parentFieldName,
          req,
          slugPathFieldName,
          titleFieldName,
          titlePathFieldName,
        }),
      slugFieldName,
      slugify,
      slugPathFieldName,
      titleFieldName,
      titlePathFieldName,
      titlePathSeparator,
    })
  } else {
    // Root document (no parent)
    const titleValue = getTitleValue({
      document: doc,
      isTitleLocalized,
      locale,
      req,
      titleFieldName,
    })
    context.hierarchyAncestorCache[collection.slug][
      `${doc.id}_${locale || 'default'}_${draft ? 'draft' : 'published'}`
    ] = {
      [parentFieldName]: null,
      [titleFieldName]: titleValue,
    }

    return buildBasePathsForDocument({
      document: doc,
      isSlugLocalized,
      isTitleLocalized,
      locale,
      req,
      slugFieldName,
      slugify,
      titleFieldName,
    })
  }
}
