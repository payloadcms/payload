import type { Document } from '../../types/index.js'

import { deepCopyObject } from '../../utilities/deepCopyObject.js'

/** A deep copy of `doc` that cannot be changed, for `originalDoc` and other read-only views. */
export function createDocumentSnapshot<T extends Document>(doc: T): Readonly<T> {
  return deepFreeze(deepCopyObject(doc))
}

function deepFreeze<T>(value: T): T {
  // A typed array with elements, such as a Buffer, cannot be frozen.
  if (value && typeof value === 'object' && !ArrayBuffer.isView(value) && !Object.isFrozen(value)) {
    Object.freeze(value)

    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }

  return value
}
