import { cloudinaryTransformer } from '@payloadcms/transformer-cloudinary'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { MediaWithFocalPoint } from './collections/MediaWithFocalPoint.js'
import { Users } from './collections/Users.js'
import { mediaSlug, mediaWithFocalPointSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Cloudinary has no local emulator, so this suite runs against a real cloud. Load the repo root
// .env first for real credentials; `.env.emulated` only supplies a placeholder so that
// credential-free tooling (type generation, config linting) can still load this config.
dotenv.config({ path: path.resolve(dirname, '../../.env') })
dotenv.config({ path: path.resolve(dirname, '../plugin-cloud-storage/.env.emulated') })

export default buildConfigWithDefaults({
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    // Cloudinary fetches the source itself, so dynamic requests only resolve when this
    // points somewhere reachable from the public internet - a tunnel, not plain localhost.
    collections: [Media, MediaWithFocalPoint, Users],
    serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: {
      transformers: [
        cloudinaryTransformer({
          collections: {
            [mediaSlug]: {
              imageSizes: [
                { name: 'square', height: 400, width: 400 },
                // Exercises Cloudinary's content-aware crop, which Sharp has no equivalent for.
                { name: 'sixteenByNineMedium', gravity: 'auto', height: 450, width: 900 },
                // Larger than the fixture in both dimensions: recorded with null metadata.
                { name: 'tooLarge', height: 5000, width: 5000 },
              ],
              resizeOptions: { width: 1200 },
            },
            [mediaWithFocalPointSlug]: {
              focalPoint: true,
              imageSizes: [{ name: 'portrait', height: 600, width: 300 }],
            },
          },
          url: process.env.CLOUDINARY_URL,
        }),
      ],
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  suite: 'transformer-cloudinary',
})
