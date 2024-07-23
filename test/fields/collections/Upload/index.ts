import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { parse } from 'exifr'
import path from 'path'
import { fileURLToPath } from 'url'

import { uploadsSlug } from '../../slugs.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const useExif: CollectionAfterChangeHook<any> = async ({
  context,
  doc,
  operation,
  req: { payload },
}) => {
  if (operation === 'update' || context?.ignoreUseExif || !doc.url) {
    return
  }
  const image = await fetch(`http://localhost:3000/${doc.url}`)
  const imageBuffer = await image.arrayBuffer()
  const metadata = await parse(imageBuffer, { mergeOutput: false })

  await payload.update({
    collection: uploadsSlug,
    id: doc.id,
    data: {
      metadata,
    },
    context: {
      ignoreUseExif: true,
    },
  })
}

const Uploads: CollectionConfig = {
  slug: uploadsSlug,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'media',
      type: 'upload',
      // filterOptions: {
      //   mimeType: {
      //     equals: 'image/png',
      //   },
      // },
      relationTo: uploadsSlug,
    },
    {
      name: 'richText',
      type: 'richText',
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    afterChange: [useExif],
  },
  upload: {
    withMetadata: ({ metadata }) => {
      if (metadata.format === 'jpeg') {
        return true
      }
      return false
    },
    staticDir: path.resolve(dirname, './uploads'),
    imageSizes: [
      {
        name: 'squareSmall',
        width: 480,
        height: 480,
        position: 'centre',
        withoutEnlargement: false,
      },
      {
        name: 'undefinedHeight',
        width: 300,
        height: undefined,
      },
      {
        name: 'undefinedWidth',
        width: undefined,
        height: 300,
      },
      {
        name: 'undefinedAll',
        width: undefined,
        height: undefined,
        fit: 'fill',
      },
    ],
  },
}

export default Uploads
