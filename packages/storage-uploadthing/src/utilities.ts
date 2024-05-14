/**
 * Extract '_key' value from the doc safely
 */
export const getKeyFromFilename = (doc: unknown, filename: string) => {
  if (
    doc &&
    typeof doc === 'object' &&
    'filename' in doc &&
    doc.filename === filename &&
    '_key' in doc
  ) {
    return doc._key as string
  }
  if (doc && typeof doc === 'object' && 'sizes' in doc) {
    const sizes = doc.sizes
    if (typeof sizes === 'object' && sizes !== null) {
      for (const size of Object.values(sizes)) {
        if (size?.filename === filename && '_key' in size) {
          return size._key as string
        }
      }
    }
  }
}
