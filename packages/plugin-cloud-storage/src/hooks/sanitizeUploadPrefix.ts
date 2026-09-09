import type { CollectionBeforeChangeHook, FileData, TypeWithID } from 'payload'

import { sanitizePrefix } from '../utilities/sanitizePrefix.js'

type StorageDocument = {
  prefix?: string
} & FileData &
  TypeWithID

export const getSanitizeUploadPrefixHook =
  (): CollectionBeforeChangeHook<StorageDocument> =>
  ({ data, req }) => {
    if (req.context?.skipCloudStorage || !req.file) {
      return data
    }

    data.prefix = sanitizePrefix(typeof data.prefix === 'string' ? data.prefix : '')
    return data
  }
