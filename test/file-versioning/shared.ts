import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const mediaSlug = 'file-versioned-media'
export const mediaDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'media')
export const draftMediaSlug = 'file-versioned-draft-media'
export const draftMediaDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'draft-media',
)
