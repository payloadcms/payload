import type { Document, PayloadRequest } from '../../types/index.js'

type GenerateVirtualTreePathsArgs = {
  collectionSlug: string
  currentDoc: Document
  parentDocFieldName: string
  req: PayloadRequest
  slugify: (text: string) => string
  slugPathFieldName: string
  titleFieldName: string
  titlePathFieldName: string
} & (
  | {
      defaultLocale: string
      localeCodes: string[]
      localized: true
      reqLocale?: string
    }
  | {
      defaultLocale?: never
      localeCodes?: never
      localized: false
      reqLocale?: never
    }
)

type PathSegment = {
  slugSegment: string
  titleSegment: string
}

/**
 * Recursively builds the full path from root to current document by traversing up the parent chain.
 * This function fetches parent documents on-demand and caches them to avoid redundant queries.
 */
export async function generateVirtualTreePaths(args: GenerateVirtualTreePathsArgs): Promise<{
  slugPath: string
  titlePath: string
}> {
  const {
    collectionSlug,
    currentDoc,
    defaultLocale,
    localized,
    parentDocFieldName,
    req,
    reqLocale,
    slugify,
    titleFieldName,
  } = args

  /**
   * Recursively fetches all ancestors and builds the path segments from root to current doc.
   */
  async function buildPathSegments(
    doc: Document,
    visitedIds: Set<number | string> = new Set(),
  ): Promise<PathSegment[]> {
    // Prevent infinite loops
    if (visitedIds.has(doc.id)) {
      return []
    }
    visitedIds.add(doc.id)

    const parentID = doc[parentDocFieldName]

    // Base case: no parent (root document)
    if (!parentID) {
      if (localized) {
        // For localized fields, we need to handle each locale
        const titleValue = doc[titleFieldName]
        const segment: PathSegment = {
          slugSegment: slugify(
            typeof titleValue === 'object' && titleValue !== null && reqLocale
              ? titleValue[reqLocale] || titleValue[defaultLocale] || ''
              : titleValue || '',
          ),
          titleSegment:
            typeof titleValue === 'object' && titleValue !== null && reqLocale
              ? titleValue[reqLocale] || titleValue[defaultLocale] || ''
              : titleValue || '',
        }
        return [segment]
      } else {
        const titleValue = doc[titleFieldName]
        const segment: PathSegment = {
          slugSegment: slugify(titleValue || ''),
          titleSegment: titleValue || '',
        }
        return [segment]
      }
    }

    // Recursive case: fetch parent and continue up the tree
    let parentDoc: Document
    try {
      parentDoc = await req.payload.findByID({
        id: parentID,
        collection: collectionSlug,
        depth: 0,
        locale: localized ? 'all' : reqLocale,
        req,
        select: {
          [parentDocFieldName]: true,
          [titleFieldName]: true,
        },
      })
    } catch (error) {
      // Parent not found or access denied, treat as root
      if (localized) {
        const titleValue = doc[titleFieldName]
        const segment: PathSegment = {
          slugSegment: slugify(
            typeof titleValue === 'object' && titleValue !== null && reqLocale
              ? titleValue[reqLocale] || titleValue[defaultLocale] || ''
              : titleValue || '',
          ),
          titleSegment:
            typeof titleValue === 'object' && titleValue !== null && reqLocale
              ? titleValue[reqLocale] || titleValue[defaultLocale] || ''
              : titleValue || '',
        }
        return [segment]
      } else {
        const titleValue = doc[titleFieldName]
        const segment: PathSegment = {
          slugSegment: slugify(titleValue || ''),
          titleSegment: titleValue || '',
        }
        return [segment]
      }
    }

    // Get parent's path segments recursively
    const parentSegments = await buildPathSegments(parentDoc, visitedIds)

    // Add current doc's segment
    if (localized) {
      const titleValue = doc[titleFieldName]
      const segment: PathSegment = {
        slugSegment: slugify(
          typeof titleValue === 'object' && titleValue !== null && reqLocale
            ? titleValue[reqLocale] || titleValue[defaultLocale] || ''
            : titleValue || '',
        ),
        titleSegment:
          typeof titleValue === 'object' && titleValue !== null && reqLocale
            ? titleValue[reqLocale] || titleValue[defaultLocale] || ''
            : titleValue || '',
      }
      return [...parentSegments, segment]
    } else {
      const titleValue = doc[titleFieldName]
      const segment: PathSegment = {
        slugSegment: slugify(titleValue || ''),
        titleSegment: titleValue || '',
      }
      return [...parentSegments, segment]
    }
  }

  // Build the path segments
  const segments = await buildPathSegments(currentDoc)

  // Join segments into full paths
  return {
    slugPath: segments.map((s) => s.slugSegment).join('/'),
    titlePath: segments.map((s) => s.titleSegment).join('/'),
  }
}
