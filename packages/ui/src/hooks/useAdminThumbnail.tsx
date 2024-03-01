import type { GetAdminThumbnail } from 'payload/types'

import { useAddClientFunction, useDocumentInfo } from '..'

export const useAdminThumbnail = (func: GetAdminThumbnail) => {
  const { collectionSlug } = useDocumentInfo()
  useAddClientFunction(`${collectionSlug}.adminThumbnail`, func)
}
