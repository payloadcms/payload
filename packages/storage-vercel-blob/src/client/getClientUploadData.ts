import { sanitizePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import { sanitizeFilename } from 'payload/shared'

type GetClientUploadDataArgs = {
  collectionPrefix?: string
  docPrefix?: string
  filename: string
  useCompositePrefixes?: boolean
}

export function getClientUploadData({
  collectionPrefix,
  docPrefix,
  filename,
  useCompositePrefixes = false,
}: GetClientUploadDataArgs): {
  pathname: string
  prefix: string
} {
  const safeCollectionPrefix = sanitizePrefix(collectionPrefix || '')
  const safeDocPrefix = sanitizePrefix(docPrefix || '')
  const safeFilename = sanitizeFilename(filename)

  const pathname = useCompositePrefixes
    ? [safeCollectionPrefix, safeDocPrefix, safeFilename].filter(Boolean).join('/')
    : [safeDocPrefix || safeCollectionPrefix, safeFilename].filter(Boolean).join('/')

  return {
    pathname,
    prefix: safeDocPrefix,
  }
}
