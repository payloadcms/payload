import path from 'path'
import { fileURLToPath } from 'url'

export const usersSlug = 'users'
export const transformerMediaSlug = 'transformer-media'
export const resizePreviewMediaSlug = 'resize-preview-media'
export const outsideFitMediaSlug = 'outside-fit-media'
export const variantMediaSlug = 'variant-media'
export const contractMediaSlug = 'contract-media'
export const contractMediaDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'contract-media',
)
