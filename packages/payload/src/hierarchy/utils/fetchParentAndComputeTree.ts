import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../index.js'
import type { HierarchyDataT } from '../types.js'

import { deriveParentPathsFromPrevious } from './deriveParentPathsFromPrevious.js'
import { generateTreePaths } from './generateTreePaths.js'

type FetchParentAndComputeTreeArgs = {
  collection: SanitizedCollectionConfig
  doc: Document
  fieldIsLocalized: boolean
  localeCodes?: string[]
  newParentID: null | number | string | undefined
  parentChanged: boolean
  previousDocWithLocales: Document
  req: PayloadRequest
  reqLocale: string
  slugify: (text: string) => string
  slugPathFieldName: string
  titleFieldName: string
  titlePathFieldName: string
}

/**
 * Fetches the parent document, computes the new parent tree, and generates the new tree paths.
 *
 * Handles three scenarios:
 * 1. Document moved to a new parent - fetches new parent and computes new tree and paths
 * 2. Document moved to root (no parent) - returns empty tree and paths without parent prefix
 * 3. Document title changed but parent stayed same - derives parent paths from previous document (optimization)
 *
 * Performance optimization: When only the title changes, we derive the parent's path
 * by stripping the last segment from the previous document's path instead of fetching
 * the parent from the database. This assumes paths are always kept in sync (via migration).
 */
export async function computeTreeData({
  collection,
  doc,
  fieldIsLocalized,
  localeCodes,
  newParentID,
  parentChanged,
  previousDocWithLocales,
  req,
  reqLocale,
  slugify,
  slugPathFieldName,
  titleFieldName,
  titlePathFieldName,
}: FetchParentAndComputeTreeArgs): Promise<HierarchyDataT> {
  let parentSlugPath: Record<string, string> | string | undefined
  let parentTitlePath: Record<string, string> | string | undefined
  let newParentTree: (number | string)[] = []

  if (parentChanged && newParentID) {
    // Moving document to new parent - must fetch to get parent's tree and paths
    const parentDoc = await req.payload.findByID({
      id: newParentID,
      collection: collection.slug,
      depth: 0,
      locale: 'all',
      select: {
        _parentTree: true,
        [slugPathFieldName]: true,
        [titlePathFieldName]: true,
      },
    })

    newParentTree = [...(parentDoc?._parentTree || []), newParentID]
    parentSlugPath = parentDoc ? parentDoc[slugPathFieldName] : undefined
    parentTitlePath = parentDoc ? parentDoc[titlePathFieldName] : undefined
  } else if (parentChanged && !newParentID) {
    // Moved document to the root (no parent)
    newParentTree = []
    parentSlugPath = undefined
    parentTitlePath = undefined
  } else {
    // Document did not move, but the title changed
    const derivedPaths = deriveParentPathsFromPrevious({
      fieldIsLocalized,
      localeCodes,
      previousDocWithLocales,
      slugPathFieldName,
      titlePathFieldName,
    })

    parentSlugPath = derivedPaths?.slugPath
    parentTitlePath = derivedPaths?.titlePath
    newParentTree = doc._parentTree
  }

  // Generate the new tree paths using the parent paths we fetched or derived
  const treePaths = generateTreePaths({
    docWithLocales: doc,
    previousDocWithLocales,
    slugify,
    titleFieldName,
    treeData: {
      parentSlugPath,
      parentTitlePath,
    },
    ...(fieldIsLocalized && localeCodes
      ? {
          localeCodes,
          localized: true,
          reqLocale,
        }
      : {
          localized: false,
        }),
  })

  return {
    _parentTree: newParentTree,
    slugPath: treePaths.slugPath,
    titlePath: treePaths.titlePath,
  }
}
