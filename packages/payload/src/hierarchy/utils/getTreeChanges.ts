import type { Document } from '../../types/index.js'

import { extractID } from '../../utilities/extractID.js'

type GetTreeChanges = {
  doc: Document
  parentFieldName: string
  previousDoc: Document
  slugify: (text: string) => string
  titleFieldName: string
}

type GetTreeChangesResult = {
  newParentID: null | number | string | undefined
  parentChanged: boolean
  prevParentID: null | number | string | undefined
  titleChanged: boolean
}

export function getTreeChanges({
  doc,
  parentFieldName,
  previousDoc,
  slugify,
  titleFieldName,
}: GetTreeChanges): GetTreeChangesResult {
  const prevParentID = extractID(previousDoc[parentFieldName]) || null
  const newParentID = extractID(doc[parentFieldName]) || null
  const prevTitleData = previousDoc[titleFieldName]
    ? {
        slug: slugify(previousDoc[titleFieldName]),
        title: previousDoc[titleFieldName],
      }
    : undefined
  const newTitleData = doc[titleFieldName]
    ? {
        slug: slugify(doc[titleFieldName]),
        title: doc[titleFieldName],
      }
    : undefined

  return {
    newParentID,
    parentChanged: prevParentID !== newParentID,
    prevParentID,
    titleChanged:
      prevTitleData?.slug !== newTitleData?.slug || prevTitleData?.title !== newTitleData?.title,
  }
}
