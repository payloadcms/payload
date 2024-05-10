export const getKeyFromFilename = (doc: Record<string, unknown>, filename: string) => {
  if ('filename' in doc && doc.filename === filename && '_key' in doc) {
    return doc._key
  }
  if ('sizes' in doc) {
    const sizes = doc.sizes
    if (typeof sizes === 'object' && sizes !== null) {
      for (const size of Object.values(sizes)) {
        if (size?.filename === filename && '_key' in size) {
          return size._key
        }
      }
    }
  }
}
