import type { CollectionSlug } from 'payload'

export type ExtractedExif = {
  cameraMake: null | string
  cameraModel: null | string
  latitude: null | number
  longitude: null | number
  raw: Record<string, unknown>
  takenAt: null | string
}

export type ExifPluginConfig = {
  /**
   * Upload-enabled collection slugs to extract EXIF for.
   */
  collections: CollectionSlug[]
  /**
   * Disable extraction without removing the plugin. Fields are still added so
   * the database schema stays stable; the upload hook is skipped.
   */
  disabled?: boolean
  /**
   * Group field name used to store EXIF data. Defaults to `'exif'`.
   */
  fieldName?: string
}
