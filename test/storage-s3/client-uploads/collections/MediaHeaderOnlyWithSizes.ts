import type { CollectionConfig } from 'payload'

import { mediaHeaderOnlyWithSizesSlug } from '../../shared.js'

/**
 * Like `MediaHeaderOnly`, but with `imageSizes` configured (through `sharpTransformer`, which
 * projects them back onto this collection's sanitized `upload` config) and no other
 * adjustments - `getFileContentRequirement` must still choose the `'full'` content requirement
 * here, since the transformer needs the complete file to generate thumbnails from. A client
 * upload larger than `HEADER_PROBE_BYTE_LENGTH` is a regression test for a bug where the
 * missing `imageSizes` check let this collection take the `'header'` path instead, handing a
 * truncated buffer to the transformer and crashing.
 */
export const MediaHeaderOnlyWithSizes: CollectionConfig = {
  slug: mediaHeaderOnlyWithSizesSlug,
  fields: [],
  upload: {
    disableLocalStorage: true,
  },
  versions: false,
}
