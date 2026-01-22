import type { Document } from '../../types/index.js'

import { extractID } from '../../utilities/extractID.js'

type GetTreeChanges = {
  doc: Document
  isTitleLocalized?: boolean
  parentFieldName: string
  previousDoc: Document
  reqLocale?: string
  slugify: (text: string) => string
  titleFieldName: string
}

type GetTreeChangesResult = {
  newParentID: null | number | string | undefined
  parentChanged: boolean
  titleChanged: boolean
}

export function getTreeChanges({
  doc,
  isTitleLocalized,
  parentFieldName,
  previousDoc,
  reqLocale,
  slugify,
  titleFieldName,
}: GetTreeChanges): GetTreeChangesResult {
  const prevParentID = extractID(previousDoc[parentFieldName]) || null
  const newParentID = extractID(doc[parentFieldName]) || null

  // Extract locale-specific title values for comparison
  let prevTitle: string | undefined
  let newTitle: string | undefined

  if (isTitleLocalized && reqLocale) {
    // For localized fields, extract the specific locale value
    const prevTitleField = previousDoc[titleFieldName]
    const newTitleField = doc[titleFieldName]

    prevTitle =
      prevTitleField && typeof prevTitleField === 'object' ? prevTitleField[reqLocale] : undefined

    // New title is non-localized string in beforeChange hook
    newTitle = typeof newTitleField === 'string' ? newTitleField : undefined
  } else {
    // For non-localized fields, use values directly
    prevTitle = previousDoc[titleFieldName]
    newTitle = doc[titleFieldName]
  }

  const prevTitleData = prevTitle
    ? {
        slug: slugify(prevTitle),
        title: prevTitle,
      }
    : undefined

  const newTitleData = newTitle
    ? {
        slug: slugify(newTitle),
        title: newTitle,
      }
    : undefined

  return {
    newParentID,
    parentChanged: prevParentID !== newParentID,
    titleChanged:
      prevTitleData?.slug !== newTitleData?.slug || prevTitleData?.title !== newTitleData?.title,
  }
}
