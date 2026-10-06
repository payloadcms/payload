import type { CollectionAdminOptions, Document, PayloadRequest, ViewTypes } from 'payload'

import { getDocumentListItemURL } from '../../../shared/views/List/getDocumentListItemURL.js'

/** Resolve navigation on the server so table cells and grid cards honor the same hook. */
export const resolveDocumentListItemURL = ({
  collectionSlug,
  doc,
  formatDocURL,
  hierarchyParentFieldName,
  req,
  viewType,
}: {
  collectionSlug: string
  doc: Document
  formatDocURL?: CollectionAdminOptions['formatDocURL']
  hierarchyParentFieldName?: string
  req: PayloadRequest
  viewType?: ViewTypes
}): null | string => {
  const defaultURL = getDocumentListItemURL({
    adminRoute: req.payload.config.routes?.admin || '/admin',
    collectionSlug,
    documentID: doc.id,
    hierarchyParentFieldName,
    viewType,
  })

  if (typeof formatDocURL !== 'function') {
    return defaultURL
  }

  const customURL = formatDocURL({ collectionSlug, defaultURL, doc, req, viewType })

  return typeof customURL === 'string' ? customURL : null
}
