import type { ViewTypes } from 'payload'

import { formatAdminURL } from 'payload/shared'

import { getHierarchyListURL } from '../HierarchyList/getHierarchyListURL.js'

export const getDocumentListItemURL = ({
  adminRoute,
  collectionSlug,
  documentID,
  hierarchyParentFieldName,
  viewType,
}: {
  adminRoute: string
  collectionSlug: string
  documentID: number | string
  hierarchyParentFieldName?: string
  viewType?: ViewTypes
}): string => {
  if (viewType === 'list' && hierarchyParentFieldName) {
    return getHierarchyListURL({
      adminRoute,
      collectionSlug,
      parentFieldName: hierarchyParentFieldName,
      parentID: documentID,
    })
  }

  return formatAdminURL({
    adminRoute,
    path: `/collections/${collectionSlug}${viewType === 'trash' ? '/trash' : ''}/${encodeURIComponent(String(documentID))}`,
  })
}
