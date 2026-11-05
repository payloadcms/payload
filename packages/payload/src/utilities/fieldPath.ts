const unsupportedFieldPathSegments = new Set(['__proto__'])

export const hasUnsupportedFieldPathSegment = ({
  segments,
}: {
  segments: readonly string[]
}): boolean => segments.some((segment) => unsupportedFieldPathSegments.has(segment))

export const setOwnProperty = <TTarget extends object>({
  key,
  target,
  value,
}: {
  key: PropertyKey
  target: TTarget
  value: unknown
}): TTarget => {
  if (Object.hasOwn(target, key) || !(key in target)) {
    if (!Reflect.set(target, key, value)) {
      throw new TypeError(`Cannot assign to property ${String(key)}`)
    }

    return target
  }

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  })

  return target
}

export const expandOwnDottedKey = ({
  key,
  target,
}: {
  key: string
  target: Record<string, unknown>
}): boolean => {
  if (!Object.hasOwn(target, key) || !key.includes('.')) {
    return false
  }

  const segments = key.split('.')

  if (hasUnsupportedFieldPathSegment({ segments })) {
    delete target[key]
    return false
  }

  const firstDotIndex = key.indexOf('.')
  const fieldName = key.substring(0, firstDotIndex)
  const remainingPath = key.substring(firstDotIndex + 1)

  if (!Object.hasOwn(target, fieldName) || !target[fieldName]) {
    setOwnProperty({ key: fieldName, target, value: {} })
  }

  const nestedTarget = target[fieldName] as Record<string, unknown>

  setOwnProperty({ key: remainingPath, target: nestedTarget, value: target[key] })
  delete target[key]

  return true
}
