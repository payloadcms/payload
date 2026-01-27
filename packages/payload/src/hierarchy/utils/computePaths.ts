import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../types/index.js'

import { slugify as payloadSlugify } from '../../utilities/slugify.js'
import { buildLocalizedHierarchyPaths } from './buildLocalizedHierarchyPaths.js'
import { findUseAsTitleField } from './findUseAsTitle.js'
import { getLocalizedValue } from './getLocalizedValue.js'

type ComputePathsArgs = {
  collection: SanitizedCollectionConfig
  doc: Document
  draft?: boolean
  locale?: string
  overrideAccess?: boolean
  parentFieldName: string
  req: PayloadRequest
  slugPathFieldName?: string
  titlePathFieldName?: string
}

type ComputePathsResult = {
  slugPath: Record<string, string> | string
  titlePath: Record<string, string> | string
}

// Helper to get title value - returns string for single locale, object for 'all' locales
const getTitleValue = ({
  document,
  isTitleLocalized = false,
  locale,
  req,
  titleFieldName,
}: {
  document: Document
  isTitleLocalized?: boolean
  locale?: string
  req: PayloadRequest
  titleFieldName: string
}): Record<string, string> | string => {
  const titleValue = document[titleFieldName]

  if (!titleValue) {
    return document.id?.toString() || 'untitled'
  }

  // If field is localized and we want all locales, return the full object
  if (isTitleLocalized && locale === 'all' && typeof titleValue === 'object') {
    return titleValue
  }

  // Single locale - use getLocalizedValue to handle fallback
  if (isTitleLocalized && typeof titleValue === 'object') {
    const localizedValue = getLocalizedValue({
      fallbackLocale: req.fallbackLocale,
      fieldType: 'text',
      locale: locale || req.locale || 'en',
      value: titleValue,
    })
    return localizedValue || document.id?.toString() || 'untitled'
  }

  return titleValue
}

/**
 * Computes both slug and title breadcrumb paths for a document by walking up the parent chain.
 * More efficient than computing them separately since it only walks the chain once.
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
    overrideAccess,
    parentFieldName,
    req,
    slugPathFieldName = '_h_slugPath',
    titlePathFieldName = '_h_titlePath',
  } = args

  const slugify =
    (collection.hierarchy !== false && collection.hierarchy.slugify) ||
    ((text: string) => payloadSlugify(text) || '')
  const { localized: isTitleLocalized, titleFieldName } = findUseAsTitleField(collection)

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

  let parentID = doc[parentFieldName]
  // Handle case where parent might be populated as full document
  if (typeof parentID === 'object' && parentID !== null && 'id' in parentID) {
    parentID = parentID.id
  }

  if (parentID) {
    const cache = context.hierarchyAncestorCache[collection.slug]
    const cacheKey = `${parentID}_${locale || 'default'}`

    // Check cache first
    let parent = cache[cacheKey]

    if (parent) {
      // Cache hit
      if (context.hierarchyCacheStats) {
        context.hierarchyCacheStats.hits += 1
      }
    } else {
      // Cache miss - fetch parent
      if (context.hierarchyCacheStats) {
        context.hierarchyCacheStats.misses += 1
        context.hierarchyCacheStats.queries += 1
      }

      parent = await req.payload.findByID({
        id: parentID,
        collection: collection.slug,
        depth: 10,
        draft,
        locale,
        overrideAccess,
        req,
        select: {
          [parentFieldName]: true,
          [slugPathFieldName]: true,
          [titleFieldName]: true,
          [titlePathFieldName]: true,
        },
        user: req.user,
      })

      // Store in cache
      cache[cacheKey] = parent
    }

    const docTitle = getTitleValue({ document: doc, isTitleLocalized, locale, req, titleFieldName })

    // Cache the current document
    const currentDocCacheKey = `${doc.id}_${locale || 'default'}`
    cache[currentDocCacheKey] = {
      [parentFieldName]: parentID,
      [slugPathFieldName]: undefined, // Will be set below
      [titleFieldName]: docTitle,
      [titlePathFieldName]: undefined, // Will be set below
    }

    // Handle localized case (locale === 'all' with localized title field)
    if (isTitleLocalized && locale === 'all') {
      const result = buildLocalizedHierarchyPaths({
        parentSlugPath: parent[slugPathFieldName] as Record<string, string>,
        parentTitlePath: parent[titlePathFieldName] as Record<string, string>,
        req,
        slugify,
        titleValue: docTitle as Record<string, string>,
      })

      // Update cache with computed paths
      cache[currentDocCacheKey][slugPathFieldName] = result.slugPath
      cache[currentDocCacheKey][titlePathFieldName] = result.titlePath

      return result
    }

    // Single locale case
    const result = {
      slugPath: (parent[slugPathFieldName] as string) + '/' + slugify(docTitle as string),
      titlePath: (parent[titlePathFieldName] as string) + '/' + (docTitle as string),
    }

    // Update cache with computed paths
    cache[currentDocCacheKey][slugPathFieldName] = result.slugPath
    cache[currentDocCacheKey][titlePathFieldName] = result.titlePath

    return result
  } else {
    const titleValue = getTitleValue({
      document: doc,
      isTitleLocalized,
      locale,
      req,
      titleFieldName,
    })
    context.hierarchyAncestorCache[collection.slug][doc.id] = {
      [parentFieldName]: null,
      [titleFieldName]: titleValue,
    }

    // Handle localized case (locale === 'all' with localized title field)
    if (isTitleLocalized && locale === 'all') {
      return buildLocalizedHierarchyPaths({
        req,
        slugify,
        titleValue: titleValue as Record<string, string>,
      })
    }

    // Single locale case
    return {
      slugPath: slugify(titleValue as string),
      titlePath: titleValue as string,
    }
  }
}
