import type { Document } from '../../types/index.js'

/** Read compatibility only. Persist this candidate explicitly to backfill legacy documents. */
export function migrateLegacyFocalPoint({ doc }: { doc: Document }): Document {
  if (doc._transforms !== null && doc._transforms !== undefined) {
    return doc
  }
  if (
    [doc.focalX, doc.focalY].every(
      (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100,
    )
  ) {
    return { ...doc, _transforms: { focalPoint: { x: doc.focalX, y: doc.focalY } } }
  }

  return doc
}
