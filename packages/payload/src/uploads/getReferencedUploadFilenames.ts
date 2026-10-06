import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { JsonObject } from '../types/index.js'

import { getLocalizedUploadProperties } from './sanitizeUploadData.js'

/** Collect only file identity properties, accounting for localized uploads and image sizes. */
export function getReferencedUploadFilenames({
  collectionConfig,
  doc,
  localeCodes,
}: {
  collectionConfig: SanitizedCollectionConfig
  doc: JsonObject
  localeCodes?: string[]
}): Set<string> {
  const filenames = new Set<string>()
  const localizedProperties = getLocalizedUploadProperties(collectionConfig.flattenedFields)
  const values = ({ name, value }: { name: string; value: unknown }): unknown[] =>
    localizedProperties.has(name) && value && typeof value === 'object'
      ? (localeCodes ?? Object.keys(value)).map((code) => (value as Record<string, unknown>)[code])
      : [value]

  for (const filename of values({ name: 'filename', value: doc.filename })) {
    if (typeof filename === 'string') {
      filenames.add(filename)
    }
  }

  for (const sizes of values({ name: 'sizes', value: doc.sizes })) {
    if (sizes && typeof sizes === 'object') {
      for (const size of Object.values(sizes)) {
        if (size && typeof size.filename === 'string') {
          filenames.add(size.filename)
        }
      }
    }
  }

  return filenames
}
