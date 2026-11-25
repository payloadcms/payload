import type { UploadTransformer } from './transformers/types.js'
import type { SanitizedUploadConfig, VariantsOwner } from './types.js'

import { matchesMimeType } from './transformers/matchesMimeType.js'

type OwnersUpload = Pick<Partial<SanitizedUploadConfig>, 'variantOwners'>

/** A variants owner that makes its variants with the `transformVariant` hook. */
export type HookVariantOwner = {
  owner: VariantsOwner
  transformer: Required<Pick<UploadTransformer, 'transformVariant'>> & UploadTransformer
}

/**
 * The variants owners for a file that make their variants with the hook, whether or not their
 * `canTransform` lets them run for this upload.
 */
export function getHookVariantOwners({
  mimeType,
  transformers,
  upload,
}: {
  mimeType?: string
  transformers: readonly UploadTransformer[]
  upload?: OwnersUpload
}): HookVariantOwner[] {
  return getVariantOwners({ mimeType, upload }).flatMap((owner) => {
    const transformer = transformers.find(({ slug }) => slug === owner.slug)

    return typeof transformer?.transformVariant === 'function'
      ? [{ owner, transformer: transformer as HookVariantOwner['transformer'] }]
      : []
  })
}

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
