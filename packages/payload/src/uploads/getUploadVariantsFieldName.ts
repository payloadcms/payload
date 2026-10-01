import type { Config, SanitizedConfig } from '../config/types.js'
import type { FileSizes } from './types.js'

export type UploadVariantsFieldName = 'sizes' | 'variants'

/**
 * The name upload documents store their generated variants under. With the deprecated
 * `upload.legacySizes` flag on, that's still the 3.x `sizes` field, so a database written by 3.x
 * works unmigrated, and `variants` is a read-only virtual alias of it. Code that reads or writes
 * stored upload data, or queries the database directly, must use this name rather than
 * hard-coding either one.
 */
export function getUploadVariantsFieldName({
  config,
}: {
  config: Pick<Config | SanitizedConfig, 'upload'>
}): UploadVariantsFieldName {
  return config.upload?.legacySizes ? 'sizes' : 'variants'
}

/**
 * The generated variants stored on an upload document, read from wherever
 * `getUploadVariantsFieldName` says they're stored. Works on raw database documents and on read
 * results alike.
 */
export function getStoredUploadVariants({
  config,
  doc,
}: {
  config: Pick<Config | SanitizedConfig, 'upload'>
  doc: unknown
}): FileSizes | undefined {
  if (!doc || typeof doc !== 'object') {
    return undefined
  }

  const variants = (doc as Record<string, unknown>)[getUploadVariantsFieldName({ config })]

  return variants && typeof variants === 'object' ? (variants as FileSizes) : undefined
}
