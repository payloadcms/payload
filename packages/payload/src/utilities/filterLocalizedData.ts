export function filterLocales(
  obj: any,
  selectedLocales: string[],
  keepEmptyObjects = false,
): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => filterLocales(item, selectedLocales, keepEmptyObjects))
  }

  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const valueKeys = Object.keys(value)

        const allKeysLookLikeLocales =
          valueKeys.length >= 2 &&
          valueKeys.length <= 5 &&
          valueKeys.every(
            (k) => typeof k === 'string' && /^[a-z]{2}(?:[-_][A-Za-z0-9]+)?$/.test(k),
          ) &&
          valueKeys.some((k) => selectedLocales.includes(k))

        if (allKeysLookLikeLocales) {
          const filtered = Object.fromEntries(
            Object.entries(value).filter(([locale]) => selectedLocales.includes(locale)),
          )

          if (Object.keys(filtered).length > 0 || keepEmptyObjects) {
            result[key] = filtered
          } else {
            // return empty object
          }

          continue
        }
      }

      result[key] = filterLocales(value, selectedLocales, keepEmptyObjects)
    }

    return result
  }
  return obj
}
