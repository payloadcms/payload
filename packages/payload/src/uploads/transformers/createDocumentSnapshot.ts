import type { UploadDocument } from './types.js'

/** Freeze a detached pipeline-entry snapshot, including nested custom field values. */
export function createDocumentSnapshot({ doc }: { doc: UploadDocument }): Readonly<UploadDocument> {
  return freeze({ value: structuredClone(doc) })
}

function freeze<T>({ value }: { value: T }): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)

    for (const child of Object.values(value)) {
      freeze({ value: child })
    }
  }

  return value
}
