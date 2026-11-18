import path from 'path'
import { fileURLToPath } from 'url'

export const dynamicMediaSlug = 'dynamic-media'
export const dynamicMediaDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'dynamic-media',
)
export const publicCloudMediaSlug = 'public-cloud-dynamic-media'
export const versionedDynamicMediaSlug = 'versioned-dynamic-media'
export const versionedDynamicMediaDir = path.resolve(dynamicMediaDir, '../versioned-dynamic-media')
export const versionedCloudMediaSlug = 'versioned-cloud-dynamic-media'
