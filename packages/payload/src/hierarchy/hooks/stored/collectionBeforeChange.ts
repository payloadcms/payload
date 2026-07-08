import type { CollectionBeforeChangeHook } from '../../../index.js'
import type { Document } from '../../../types/index.js'

import { computePaths } from '../../utils/computePaths.js'
import { isDocumentDraft } from '../../utils/isDocumentDraft.js'

type Args = {
  parentFieldName: string
  slugPathFieldName: string
  titleFieldName: string
  titlePathFieldName: string
}

export const collectionBeforeChangeStored =
  ({
    parentFieldName,
    slugPathFieldName,
    titleFieldName,
    titlePathFieldName,
  }: Args): CollectionBeforeChangeHook =>
  async ({ collection, data, originalDoc, req }) => {
    const mergedDoc: Document = {
      ...(originalDoc || {}),
      ...data,
    }
    const parentValue = mergedDoc[parentFieldName]

    if (parentValue && typeof parentValue === 'object' && 'id' in parentValue) {
      mergedDoc[parentFieldName] = parentValue.id
    }

    const draft = isDocumentDraft({
      doc: mergedDoc,
      locale: req.locale || req.payload.config.localization?.defaultLocale,
    })

    const { slugPath, titlePath } = await computePaths({
      collection,
      doc: mergedDoc,
      draft,
      locale: req.locale === 'all' ? 'all' : req.locale || undefined,
      parentFieldName,
      req,
      slugPathFieldName,
      titleFieldName,
      titlePathFieldName,
    })

    data[slugPathFieldName] = slugPath
    data[titlePathFieldName] = titlePath

    return data
  }
