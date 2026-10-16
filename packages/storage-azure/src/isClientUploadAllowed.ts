export const isClientUploadAllowed = (collection?: {
  upload?: { allowRestrictedFileTypes?: boolean } | boolean
}): boolean =>
  Boolean(
    collection &&
      typeof collection.upload === 'object' &&
      collection.upload.allowRestrictedFileTypes,
  )
