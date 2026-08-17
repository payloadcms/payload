import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { mediaWithStaticDirSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Points at a real directory so tests can leave a local file behind the cloud-stored uploads. */
export const staticDir = path.resolve(dirname, 'static-dir')

export const MediaWithStaticDir: CollectionConfig = {
  slug: mediaWithStaticDirSlug,
  fields: [],
  upload: {
    staticDir,
  },
  versions: false,
}
