import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const mediaSlug = 'file-versioned-media'
export const mediaDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'media')
export const draftMediaSlug = 'file-versioned-draft-media'
export const draftMediaDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'draft-media',
)
export const transformedMediaSlug = 'file-versioned-transformed-media'
export const transformedMediaDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'transformed-media',
)
export const convertedMediaSlug = 'file-versioned-converted-media'
export const convertedMediaDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'converted-media',
)
