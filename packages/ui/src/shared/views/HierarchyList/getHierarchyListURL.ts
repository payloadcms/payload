import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

export const getHierarchyListURL = ({
  adminRoute,
  collectionSlug,
  parentFieldName = 'parent',
  parentID,
}: {
  adminRoute: string
  collectionSlug: string
  parentFieldName?: string
  parentID?: number | string
}): string => {
  const query = qs.stringify(
    {
      ...(parentID !== undefined ? { [parentFieldName]: parentID } : {}),
      view: 'hierarchy',
    },
    { addQueryPrefix: true },
  )

  return formatAdminURL({
    adminRoute,
    path: `/collections/${collectionSlug}${query}`,
  })
}
