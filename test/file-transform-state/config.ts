import { sharpTransformer } from '@payloadcms/transformer-sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { DynamicMedia } from './collections/DynamicMedia/index.js'
import { Media } from './collections/Media/index.js'
import { dynamicMediaSlug, mediaSlug } from './shared.js'
import { recordingTransformer } from './transformerFixtures.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const transformer = sharpTransformer({
  collections: {
    [dynamicMediaSlug]: { variants: [{ name: 'square', height: 3, width: 3 }] },
    [mediaSlug]: { variants: [{ name: 'small', height: 3, width: 3 }] },
  },
  dynamic: true,
})
const canTransform = transformer.canTransform!
transformer.canTransform = (args) =>
  args.collectionSlug === dynamicMediaSlug && args.operation === 'upload'
    ? false
    : canTransform(args)

export default buildConfigWithDefaults({
  config: {
    collections: [Media, DynamicMedia],
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
    upload: {
      transformers: [
        transformer,
        {
          ...recordingTransformer({ slug: 'video-recorder', mimeType: 'video/mp4' }),
          transformDefinitions: {
            watermark: {
              type: 'object',
              additionalProperties: false,
              description: 'Watermark intent interpreted by the video adapter.',
              properties: { text: { type: 'string', description: 'Visible watermark text.' } },
              required: ['text'],
            },
          },
        },
        recordingTransformer({ slug: 'pdf-recorder', mimeType: 'application/pdf' }),
      ],
    },
  },
  suite: 'file-transform-state',
})
