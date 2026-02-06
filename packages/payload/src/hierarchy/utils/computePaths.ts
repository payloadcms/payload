import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../types/index.js'

import { slugify as payloadSlugify } from '../../utilities/slugify.js'
import {
  HIERARCHY_DEFAULT_LOCALE,
  HIERARCHY_SLUG_PATH_FIELD,
  HIERARCHY_TITLE_PATH_FIELD,
} from '../constants.js'
import { buildLocalizedHierarchyPaths } from './buildLocalizedHierarchyPaths.js'
import { findUseAsTitleField } from './findUseAsTitle.js'
import { getLocalizedValue } from './getLocalizedValue.js'

type ComputePathsArgs = {
  collection: SanitizedCollectionConfig
  doc: Document
  draft?: boolean
  locale?: string
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
    slugPathFieldName = HIERARCHY_SLUG_PATH_FIELD,
    titlePathFieldName = HIERARCHY_TITLE_PATH_FIELD,
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

  const parentValue = doc[parentFieldName]
  let parentID: number | string | undefined

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
    // Parent is always from the same collection (self-referential)
    const parentCollectionConfig = collection
    const parentHierarchyConfig = parentCollectionConfig.hierarchy

    // If parent collection doesn't have hierarchy, we can't compute paths through it
    if (!parentHierarchyConfig || !parentCollectionConfig) {
      const titleValue = getTitleValue({
        document: doc,
        isTitleLocalized,
        locale,
        req,
        titleFieldName,
      })

      if (isTitleLocalized && locale === 'all') {
        return buildLocalizedHierarchyPaths({
          req,
          slugify,
          titleValue: titleValue as Record<string, string>,
        })
      }

      return {
        slugPath: slugify(titleValue as string),
        titlePath: titleValue as string,
      }
    }

    // Initialize cache for parent collection if needed
    if (!context.hierarchyAncestorCache[collection.slug]) {
      context.hierarchyAncestorCache[collection.slug] = {}
    }

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

      const parentTitleField = findUseAsTitleField(parentCollectionConfig).titleFieldName

      // parentID is guaranteed to be defined here (we're inside if (parentID))
      const validParentID = parentID

      // Create new context with computeHierarchyPaths enabled to trigger recursive path computation
      const parentReq = {
        ...req,
        context: {
          ...req.context,
          computeHierarchyPaths: true,
        },
      }

      // Fetch parent
      // When locale === 'all', we need special handling because Payload doesn't support
      // fetching all locales of a draft document (drafts are stored per-locale).
      // Strategy: Try published first, fallback to fetching each locale separately for drafts.
      const fetchParent = async () => {
        if (locale === 'all') {
          try {
            // First try to fetch published version with all locales
            return await req.payload.findByID({
              id: validParentID,
              collection: collection.slug,
              depth: 0,
              locale,
              overrideAccess: true,
              req: parentReq,
              select: {
                [parentHierarchyConfig.parentFieldName]: true,
                [parentHierarchyConfig.slugPathFieldName]: true,
                [parentHierarchyConfig.titlePathFieldName]: true,
                [parentTitleField]: true,
              },
              user: req.user,
            })
          } catch (error) {
            // Published version not found, must be a draft
            // Payload doesn't support fetching all locales of a draft with a single query
            // So we need to fetch each locale separately and combine the path data
            const locales = req.payload.config.localization
              ? req.payload.config.localization.localeCodes
              : [HIERARCHY_DEFAULT_LOCALE]
            const parentPathsByLocale: Record<
              string,
              { slugPath?: string; title?: string; titlePath?: string }
            > = {}

            // Get parent collection's slugify function (may differ from child's)
            const parentSlugify =
              (parentCollectionConfig.hierarchy !== false &&
                parentCollectionConfig.hierarchy.slugify) ||
              ((text: string) => payloadSlugify(text) || '')

            // Fetch parent for each locale to get paths
            for (const loc of locales) {
              // Create a new request with this specific locale but keep computeHierarchyPaths flag
              const localeReq = {
                ...req,
                context: {
                  ...req.context,
                  computeHierarchyPaths: true,
                },
                locale: loc,
              }

              try {
                const parentForLocale = await req.payload.findByID({
                  id: validParentID,
                  collection: collection.slug,
                  depth: 0,
                  draft: true,
                  locale: loc,
                  overrideAccess: true,
                  req: localeReq,
                  user: req.user,
                })

                // Extract the path fields and title from the parent
                // If paths weren't computed (undefined), compute them manually for root documents
                let parentSlugPath = parentForLocale[parentHierarchyConfig.slugPathFieldName]
                let parentTitlePath = parentForLocale[parentHierarchyConfig.titlePathFieldName]
                const parentTitle = parentForLocale[parentTitleField]

                // If paths are undefined, this might be a root document - compute paths from title
                if (!parentSlugPath && parentTitle) {
                  parentSlugPath = parentSlugify(parentTitle)
                }
                if (!parentTitlePath && parentTitle) {
                  parentTitlePath = parentTitle
                }

                parentPathsByLocale[loc] = {
                  slugPath: parentSlugPath,
                  title: parentTitle,
                  titlePath: parentTitlePath,
                }
              } catch (localeError) {
                // This locale doesn't exist, skip it
              }
            }

            // Combine the path data from all locales into a single parent object
            const combinedSlugPaths: Record<string, string | undefined> = {}
            const combinedTitlePaths: Record<string, string | undefined> = {}
            const combinedTitles: Record<string, string | undefined> = {}

            for (const loc of locales) {
              if (parentPathsByLocale[loc]) {
                combinedSlugPaths[loc] = parentPathsByLocale[loc].slugPath
                combinedTitlePaths[loc] = parentPathsByLocale[loc].titlePath
                combinedTitles[loc] = parentPathsByLocale[loc].title
              }
            }

            // Return a parent object with only the hierarchy fields we need
            // (all properly formatted as multi-locale objects)
            return {
              id: validParentID,
              [parentHierarchyConfig.slugPathFieldName]: combinedSlugPaths,
              [parentHierarchyConfig.titlePathFieldName]: combinedTitlePaths,
              [parentTitleField]: combinedTitles,
            }
          }
        } else {
          // Normal case: single locale, can pass draft parameter
          return await req.payload.findByID({
            id: validParentID,
            collection: collection.slug,
            depth: 0,
            draft,
            locale,
            overrideAccess: true,
            req: parentReq,
            select: {
              [parentHierarchyConfig.parentFieldName]: true,
              [parentHierarchyConfig.slugPathFieldName]: true,
              [parentHierarchyConfig.titlePathFieldName]: true,
              [parentTitleField]: true,
            },
            user: req.user,
          })
        }
      }

      try {
        parent = await fetchParent()

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
      const titleValue = getTitleValue({
        document: doc,
        isTitleLocalized,
        locale,
        req,
        titleFieldName,
      })

      if (isTitleLocalized && locale === 'all') {
        return buildLocalizedHierarchyPaths({
          req,
          slugify,
          titleValue: titleValue as Record<string, string>,
        })
      }

      return {
        slugPath: slugify(titleValue as string),
        titlePath: titleValue as string,
      }
    }

    const docTitle = getTitleValue({ document: doc, isTitleLocalized, locale, req, titleFieldName })

    // Cache the current document (in its own collection's cache)
    const currentDocCacheKey = `${doc.id}_${locale || 'default'}`
    if (!context.hierarchyAncestorCache[collection.slug]) {
      context.hierarchyAncestorCache[collection.slug] = {}
    }
    context.hierarchyAncestorCache[collection.slug][currentDocCacheKey] = {
      [parentFieldName]: parentID,
      [slugPathFieldName]: undefined, // Will be set below
      [titleFieldName]: docTitle,
      [titlePathFieldName]: undefined, // Will be set below
    }

    // Get parent's path field names from hierarchy config
    const parentSlugPathFieldName =
      parentCollectionConfig.hierarchy !== false
        ? parentCollectionConfig.hierarchy.slugPathFieldName
        : HIERARCHY_SLUG_PATH_FIELD
    const parentTitlePathFieldName =
      parentCollectionConfig.hierarchy !== false
        ? parentCollectionConfig.hierarchy.titlePathFieldName
        : HIERARCHY_TITLE_PATH_FIELD

    // Handle localized case (locale === 'all' with localized title field)
    if (isTitleLocalized && locale === 'all') {
      // Parent might have non-localized title field, resulting in string paths instead of objects
      // Convert parent paths to objects if they're strings (use same value for all locales)
      let parentSlugPathObj: Record<string, string> | undefined = parent[
        parentSlugPathFieldName
      ] as Record<string, string> | undefined
      let parentTitlePathObj: Record<string, string> | undefined = parent[
        parentTitlePathFieldName
      ] as Record<string, string> | undefined

      // If parent paths are strings (non-localized parent), convert to objects for all locales
      if (typeof parentSlugPathObj === 'string') {
        const locales = req.payload.config.localization
          ? req.payload.config.localization.localeCodes
          : []
        const slugValue = parentSlugPathObj
        parentSlugPathObj = {}
        for (const loc of locales) {
          parentSlugPathObj[loc] = slugValue
        }
      }

      if (typeof parentTitlePathObj === 'string') {
        const locales = req.payload.config.localization
          ? req.payload.config.localization.localeCodes
          : []
        const titleValue = parentTitlePathObj
        parentTitlePathObj = {}
        for (const loc of locales) {
          parentTitlePathObj[loc] = titleValue
        }
      }

      // If parent paths are undefined (parent fetch failed or paths not computed),
      // buildLocalizedHierarchyPaths will handle it by using just the child's title
      const result = buildLocalizedHierarchyPaths({
        parentSlugPath: parentSlugPathObj,
        parentTitlePath: parentTitlePathObj,
        req,
        slugify,
        titleValue: docTitle as Record<string, string>,
      })

      // Update cache with computed paths
      context.hierarchyAncestorCache[collection.slug][currentDocCacheKey][slugPathFieldName] =
        result.slugPath
      context.hierarchyAncestorCache[collection.slug][currentDocCacheKey][titlePathFieldName] =
        result.titlePath

      return result
    }

    // Single locale case
    const result = {
      slugPath: (parent[parentSlugPathFieldName] as string) + '/' + slugify(docTitle as string),
      titlePath: (parent[parentTitlePathFieldName] as string) + '/' + (docTitle as string),
    }

    // Update cache with computed paths
    context.hierarchyAncestorCache[collection.slug][currentDocCacheKey][slugPathFieldName] =
      result.slugPath
    context.hierarchyAncestorCache[collection.slug][currentDocCacheKey][titlePathFieldName] =
      result.titlePath

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
