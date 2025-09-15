import type { Document } from '../../types/index.js'

type GetTreeChanges = {
  doc: Document
  parentDocFieldName: string
  previousDoc: Document
  slugify: (text: string) => string
  titleFieldName: string
}

type GetTreeChangesResult = {
  newParentID: null | number | string | undefined
  parentChanged: boolean
  prevParentID: null | number | string | undefined
  slugChanged: boolean
}

export function getTreeChanges({
  doc,
  parentDocFieldName,
  previousDoc,
  slugify,
  titleFieldName,
}: GetTreeChanges): GetTreeChangesResult {
  const prevParentID = previousDoc[parentDocFieldName] || null
  const newParentID = doc[parentDocFieldName] || null
  const newSlug = doc[titleFieldName] ? slugify(doc[titleFieldName]) : undefined
  const prevSlug = previousDoc[titleFieldName] ? slugify(previousDoc[titleFieldName]) : undefined

  return {
    newParentID,
    parentChanged: prevParentID !== newParentID,
    prevParentID,
    slugChanged: newSlug !== prevSlug,
  }
}
