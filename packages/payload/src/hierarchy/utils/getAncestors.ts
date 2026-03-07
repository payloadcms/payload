import type { CollectionSlug } from '../../index.js'
import type { Document, PayloadRequest } from '../../types/index.js'

import { findUseAsTitleField } from './findUseAsTitle.js'
import { getLocalizedValue } from './getLocalizedValue.js'

export type Ancestor = {
  id: number | string
  title: string
}

type GetAncestorsArgs = {
  /**
   * The collection slug
   */
  collectionSlug: CollectionSlug
  /**
   * The document ID to get ancestors for
   */
  id: number | string
  /**
   * Include the document itself in the returned ancestors (as last item)
   * @default true
   */
  includeSelf?: boolean
  /**
   * The request object
   */
  req: PayloadRequest
}

/**
 * Get ancestor chain for a hierarchical document.
 * Returns array of {id, title} from root to the document.
 *
 * Uses request context caching for efficiency when called multiple times.
 */
export async function getAncestors({
  id,
  collectionSlug,
  includeSelf = true,
  req,
}: GetAncestorsArgs): Promise<Ancestor[]> {
  const { payload, user } = req

  const collectionConfig = payload.collections[collectionSlug]?.config
  if (!collectionConfig) {
    throw new Error(`Collection "${collectionSlug}" not found`)
  }

  const hierarchyConfig = collectionConfig.hierarchy
  if (!hierarchyConfig) {
    throw new Error(`Collection "${collectionSlug}" does not have hierarchy enabled`)
  }

  const parentFieldName = hierarchyConfig.parentFieldName
  const { localized: isTitleLocalized, titleFieldName } = findUseAsTitleField(collectionConfig)

  // Initialize cache if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context = req.context as any
  if (!context.hierarchyAncestorCache) {
    context.hierarchyAncestorCache = {}
  }
  if (!context.hierarchyAncestorCache[collectionSlug]) {
    context.hierarchyAncestorCache[collectionSlug] = {}
  }

  const cache = context.hierarchyAncestorCache[collectionSlug]
  const ancestors: Ancestor[] = []

  let currentId: null | number | string = id

  while (currentId !== null) {
    const cacheKey: string = `ancestors_${currentId}`

    // Check cache first
    let doc: Document = cache[cacheKey]

    if (!doc) {
      // Cache miss - fetch document
      try {
        doc = await payload.findByID({
          id: currentId,
          collection: collectionSlug,
          depth: 0,
          overrideAccess: false,
          req,
          select: {
            [parentFieldName]: true,
            [titleFieldName]: true,
          },
          user,
        })
        cache[cacheKey] = doc
      } catch {
        break
      }
    }

    if (!doc) {
      break
    }

    // Extract title
    const rawTitle: unknown = doc[titleFieldName]
    let title: string

    if (isTitleLocalized && rawTitle && typeof rawTitle === 'object' && req.locale) {
      const localizedValue = getLocalizedValue({
        fallbackLocale: req.fallbackLocale,
        fieldType: 'text',
        locale: req.locale,
        value: rawTitle,
      })
      title = localizedValue || String(doc.id || currentId)
    } else if (isTitleLocalized && rawTitle && typeof rawTitle === 'object') {
      // No locale set - use first available value
      const values = Object.values(rawTitle as Record<string, string>)
      title = values[0] || String(doc.id || currentId)
    } else {
      title = String(rawTitle || doc.id || currentId)
    }

    ancestors.unshift({ id: currentId, title })

    // Get parent ID for next iteration
    const parentValue: unknown = doc[parentFieldName]
    if (!parentValue) {
      break
    }

    currentId =
      typeof parentValue === 'object' && parentValue !== null && 'id' in parentValue
        ? (parentValue as { id: number | string }).id
        : (parentValue as number | string)
  }

  if (!includeSelf && ancestors.length > 0) {
    ancestors.pop()
  }

  return ancestors
}
