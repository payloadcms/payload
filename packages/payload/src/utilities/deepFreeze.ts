/**
 * Freezes `value` and every object and array inside it, so nothing can change it. Returns the
 * same value. Typed arrays, such as a Buffer, are skipped, because they cannot be frozen.
 */
export const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !ArrayBuffer.isView(value) && !Object.isFrozen(value)) {
    Object.freeze(value)

    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }

  return value
}
