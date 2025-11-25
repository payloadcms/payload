import type { CollectionAfterReadHook, FieldAffectingData } from '../../index.js'

import { generateVirtualTreePaths } from '../utils/generateVirtualTreePaths.js'

type Args = {
  parentDocFieldName?: string
  slugify?: (text: string) => string
  slugPathFieldName?: string
  titleField: FieldAffectingData
  titlePathFieldName?: string
}

export const hierarchyCollectionAfterRead =
  ({
    parentDocFieldName,
    slugify,
    slugPathFieldName,
    titleField,
    titlePathFieldName,
  }: Required<Args>): CollectionAfterReadHook =>
  async ({ collection, doc, req }) => {
    const fieldIsLocalized = Boolean(titleField.localized)
    const titleFieldName: string = titleField.name!
    const reqLocale = req.locale

    // Skip if locale is 'all'
    if (reqLocale === 'all') {
      return doc
    }

    // Generate tree paths recursively
    const treePaths = await generateVirtualTreePaths({
      collectionSlug: collection.slug,
      currentDoc: doc,
      parentDocFieldName,
      req,
      slugify,
      slugPathFieldName,
      titleFieldName,
      titlePathFieldName,
      ...(fieldIsLocalized && req.payload.config.localization
        ? {
            defaultLocale: req.payload.config.localization.defaultLocale,
            localeCodes: req.payload.config.localization.localeCodes,
            localized: true,
            reqLocale: reqLocale as string,
          }
        : {
            localized: false,
          }),
    })

    doc[slugPathFieldName] = treePaths.slugPath
    doc[titlePathFieldName] = treePaths.titlePath

    return doc
  }
