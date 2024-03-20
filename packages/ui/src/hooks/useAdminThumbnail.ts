import type { GetAdminThumbnail } from 'payload/types'

import { useAddClientFunction } from '../providers/ClientFunction/index.js'
import { useDocumentInfo } from '../providers/DocumentInfo/index.js'

export const useAdminThumbnail = (func: GetAdminThumbnail) => {
  const { collectionSlug } = useDocumentInfo()
  useAddClientFunction(`${collectionSlug}.adminThumbnail`, func)
}
