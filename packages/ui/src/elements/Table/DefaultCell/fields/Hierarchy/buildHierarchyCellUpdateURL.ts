import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

export const buildHierarchyCellUpdateURL = ({
  id,
  apiRoute,
  branch,
  collectionSlug,
  serverURL,
}: {
  apiRoute: string
  branch?: string
  collectionSlug: string
  id: number | string
  serverURL: string
}): string => {
  const queryString = qs.stringify({ branch }, { addQueryPrefix: true })

  return formatAdminURL({
    apiRoute,
    path: `/${collectionSlug}/${id}${queryString}`,
    serverURL,
  })
}
