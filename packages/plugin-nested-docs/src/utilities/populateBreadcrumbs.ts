import type { Data, Document, PayloadRequest, SanitizedCollectionConfig } from 'payload'

import type { GenerateLabel, GenerateURL } from '../types.js'

import { formatBreadcrumb } from './formatBreadcrumb.js'
import { getParents as getAllParentDocuments } from './getParents.js'

type Args = {
  breadcrumbsFieldName?: string
  collection: SanitizedCollectionConfig
  data: Data
  generateLabel?: GenerateLabel
  generateURL?: GenerateURL
  originalDoc?: Document
  parentFieldName?: string
  req: PayloadRequest
}
export const populateBreadcrumbs = async ({
  breadcrumbsFieldName = 'breadcrumbs',
  collection,
  data,
  generateLabel,
  generateURL,
  originalDoc,
  parentFieldName,
  req,
}: Args): Promise<Data> => {
  const newData = data
  const currentDocument = {
    ...originalDoc,
    ...data,
  }
  const allParentDocuments: Document[] = await getAllParentDocuments(
    req,
    {
      generateLabel,
      generateURL,
      parentFieldSlug: parentFieldName,
    },
    collection,
    currentDocument,
  )

  if (originalDoc?.id) {
    currentDocument.id = originalDoc?.id
  }

  allParentDocuments.push(currentDocument)

  const breadcrumbs = allParentDocuments.map((_, i) =>
    formatBreadcrumb({
      collection,
      docs: allParentDocuments.slice(0, i + 1),
      generateLabel,
      generateURL,
    }),
  )

  newData[breadcrumbsFieldName] = breadcrumbs

  return newData
}
