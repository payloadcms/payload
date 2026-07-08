import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../../types/index.js'
import type { ComputePathsResult } from './types.js'

import { buildLocalizedHierarchyPaths } from '../buildLocalizedHierarchyPaths.js'
import { getSlugFieldValue, getTitleValue, toLocalizedPathMap } from './valueResolvers.js'

type BuildDocumentPathsArgs = {
  collection: SanitizedCollectionConfig
  context: PayloadRequest['context']
  currentDocCacheKey: string
  doc: Document
  draft: boolean
  isSlugLocalized: boolean
  isTitleLocalized: boolean
  locale?: string
  parent: Document
  parentFieldName: string
  req: PayloadRequest
  resolveParentPaths: () => Promise<ComputePathsResult>
  slugFieldName?: string
  slugify: (val: string) => string
  slugPathFieldName: string
  titleFieldName: string
  titlePathFieldName: string
  titlePathSeparator: string
}

const getParentPathValues = async ({
  isSlugLocalized,
  isTitleLocalized,
  locale,
  parent,
  parentFieldName,
  parentSlugPathFieldName,
  parentTitlePathFieldName,
  req,
  resolveParentPaths,
  slugFieldName,
  slugify,
  titleFieldName,
}: {
  isSlugLocalized: boolean
  isTitleLocalized: boolean
  locale?: string
  parent: Document
  parentFieldName: string
  parentSlugPathFieldName: string
  parentTitlePathFieldName: string
  req: PayloadRequest
  resolveParentPaths: () => Promise<ComputePathsResult>
  slugFieldName?: string
  slugify: (val: string) => string
  titleFieldName: string
}): Promise<{
  parentSlugPath?: Record<string, string> | string
  parentTitlePath?: Record<string, string> | string
}> => {
  const parentSlugPath = parent[parentSlugPathFieldName]
  const parentTitlePath = parent[parentTitlePathFieldName]

  if (parentSlugPath !== undefined && parentTitlePath !== undefined) {
    return {
      parentSlugPath,
      parentTitlePath,
    }
  }

  if (!parent[parentFieldName]) {
    const parentTitle = getTitleValue({
      document: parent,
      isTitleLocalized,
      locale,
      req,
      titleFieldName,
    })
    const parentSlug = slugFieldName
      ? getSlugFieldValue({
          document: parent,
          isSlugLocalized,
          locale,
          req,
          slugFieldName,
        })
      : undefined

    return {
      parentSlugPath: parentSlug !== undefined ? parentSlug : slugify(parentTitle as string),
      parentTitlePath: parentTitle,
    }
  }

  const resolvedParentPaths = await resolveParentPaths()
  return {
    parentSlugPath: parentSlugPath !== undefined ? parentSlugPath : resolvedParentPaths.slugPath,
    parentTitlePath:
      parentTitlePath !== undefined ? parentTitlePath : resolvedParentPaths.titlePath,
  }
}

const buildLocalizedDocumentPaths = async ({
  collection,
  context,
  currentDocCacheKey,
  doc,
  isSlugLocalized: isSlugFieldLocalized,
  isTitleLocalized,
  locale,
  parent,
  parentFieldName,
  req,
  resolveParentPaths,
  slugFieldName,
  slugify,
  slugPathFieldName,
  titleFieldName,
  titlePathFieldName,
  titlePathSeparator,
}: BuildDocumentPathsArgs): Promise<ComputePathsResult> => {
  const locales = req.payload.config.localization ? req.payload.config.localization.localeCodes : []
  const parentPathValues = await getParentPathValues({
    isSlugLocalized: isSlugFieldLocalized,
    isTitleLocalized,
    locale,
    parent,
    parentFieldName,
    parentSlugPathFieldName: slugPathFieldName,
    parentTitlePathFieldName: titlePathFieldName,
    req,
    resolveParentPaths,
    slugFieldName,
    slugify,
    titleFieldName,
  })

  const parentSlugPathObj = toLocalizedPathMap({
    locales,
    value: parentPathValues.parentSlugPath,
  })
  const parentTitlePathObj = toLocalizedPathMap({
    locales,
    value: parentPathValues.parentTitlePath,
  })

  const docSlugValue = slugFieldName
    ? getSlugFieldValue({
        document: doc,
        isSlugLocalized: isSlugFieldLocalized,
        locale,
        req,
        slugFieldName,
      })
    : undefined

  const docTitle = getTitleValue({
    document: doc,
    isTitleLocalized,
    locale,
    req,
    titleFieldName,
  })

  const result = buildLocalizedHierarchyPaths({
    parentSlugPath: parentSlugPathObj,
    parentTitlePath: parentTitlePathObj,
    req,
    slugify,
    slugValue: docSlugValue as Record<string, string> | undefined,
    titlePathSeparator,
    titleValue: docTitle as Record<string, string>,
  })

  context.hierarchyAncestorCache[collection.slug][currentDocCacheKey][slugPathFieldName] =
    result.slugPath
  context.hierarchyAncestorCache[collection.slug][currentDocCacheKey][titlePathFieldName] =
    result.titlePath

  return result
}

const buildSingleLocaleDocumentPaths = async ({
  collection,
  context,
  currentDocCacheKey,
  doc,
  isSlugLocalized: isSlugFieldLocalized,
  isTitleLocalized,
  locale,
  parent,
  parentFieldName,
  req,
  resolveParentPaths,
  slugFieldName,
  slugify,
  slugPathFieldName,
  titleFieldName,
  titlePathFieldName,
  titlePathSeparator,
}: BuildDocumentPathsArgs): Promise<ComputePathsResult> => {
  const docTitle = getTitleValue({ document: doc, isTitleLocalized, locale, req, titleFieldName })
  const docSlugValue = slugFieldName
    ? getSlugFieldValue({
        document: doc,
        isSlugLocalized: isSlugFieldLocalized,
        locale,
        req,
        slugFieldName,
      })
    : undefined

  const { parentSlugPath, parentTitlePath } = await getParentPathValues({
    isSlugLocalized: isSlugFieldLocalized,
    isTitleLocalized,
    locale,
    parent,
    parentFieldName,
    parentSlugPathFieldName: slugPathFieldName,
    parentTitlePathFieldName: titlePathFieldName,
    req,
    resolveParentPaths,
    slugFieldName,
    slugify,
    titleFieldName,
  })

  const slugSegment =
    docSlugValue !== undefined ? (docSlugValue as string) : slugify(docTitle as string)

  const result = {
    slugPath: (parentSlugPath as string) + '/' + slugSegment,
    titlePath: (parentTitlePath as string) + titlePathSeparator + (docTitle as string),
  }

  context.hierarchyAncestorCache[collection.slug][currentDocCacheKey][slugPathFieldName] =
    result.slugPath
  context.hierarchyAncestorCache[collection.slug][currentDocCacheKey][titlePathFieldName] =
    result.titlePath

  return result
}

export const buildDocumentPaths = async (
  args: BuildDocumentPathsArgs,
): Promise<ComputePathsResult> =>
  args.isTitleLocalized && args.locale === 'all'
    ? await buildLocalizedDocumentPaths(args)
    : await buildSingleLocaleDocumentPaths(args)
