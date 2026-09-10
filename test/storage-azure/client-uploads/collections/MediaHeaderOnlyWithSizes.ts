import type { CollectionConfig } from 'payload'

import { existsSync } from 'node:fs'

export const mediaHeaderOnlyWithSizesSlug = 'media-header-only-with-sizes'

/**
 * Like `MediaHeaderOnly`, but with `imageSizes` configured and no other adjustments -
 * `getFileContentRequirement` must still choose the `'full'` content requirement here, since
 * `createImageSizes` needs the complete file to generate thumbnails from. A client upload larger
 * than `HEADER_PROBE_BYTE_LENGTH` is a regression test for a bug where the missing `imageSizes`
 * check let this collection take the `'header'` path instead, handing a truncated buffer to
 * `createImageSizes` and crashing.
 */
export const MediaHeaderOnlyWithSizes: CollectionConfig = {
  slug: mediaHeaderOnlyWithSizesSlug,
  fields: [],
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const file = req.file

        if (file?.name === 'large-with-sizes.jpg') {
          if (file.data.length !== 0 || !file.tempFilePath || !existsSync(file.tempFilePath)) {
            throw new Error('Full client upload was not staged to disk')
          }
        }

        return data
      },
    ],
  },
  upload: {
    disableLocalStorage: true,
    imageSizes: [
      {
        name: 'thumbnail',
        height: 300,
        width: 400,
      },
    ],
  },
  versions: false,
}
