import type { SanitizedUploadConfig, VariantsOwner } from './types.js'

import { matchesMimeType } from './transformers/matchesMimeType.js'

type OwnersUpload = Pick<Partial<SanitizedUploadConfig>, 'variantOwners'>

/** The transformers that make variants for a file: each owner whose MIME types match it. */
export function getVariantOwners({
  mimeType,
  upload,
}: {
  mimeType?: string
  upload?: OwnersUpload
}): VariantsOwner[] {
  if (!mimeType) {
    return []
  }

  return (upload?.variantOwners ?? []).filter((owner) =>
    owner.mimeTypes.some((pattern) => matchesMimeType({ mimeType, pattern })),
  )
}

/**
 * The transformer that makes one variant for a file. `registerUploadVariants` lets only one owner
 * of a name match a MIME type.
 */
export function getVariantOwner({
  mimeType,
  upload,
  variantName,
}: {
  mimeType?: string
  upload?: OwnersUpload
  variantName: string
}): undefined | VariantsOwner {
  return getVariantOwners({ mimeType, upload }).find((owner) =>
    owner.variantNames.includes(variantName),
  )
}
