function isLocalizedField(obj: any, selectedLocales: string[]): boolean {
  const keys = Object.keys(obj)
  const allKeysAreLocales = keys.every((k) => /^[a-z]{2}(?:[-_][A-Za-z0-9]+)?$/.test(k))
  const hasSelectedLocale = keys.some((k) => selectedLocales.includes(k))
  return allKeysAreLocales && hasSelectedLocale
}

export function filterLocales(
  obj: any,
  selectedLocales: string[],
  keepEmptyObjects = false,
): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => filterLocales(item, selectedLocales, keepEmptyObjects))
  }

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      isLocalizedField(value, selectedLocales)
    ) {
      const filtered = Object.fromEntries(
        Object.entries(value).filter(([locale]) => selectedLocales.includes(locale)),
      )
      if (Object.keys(filtered).length > 0 || keepEmptyObjects) {
        result[key] = filtered
      }
    } else {
      result[key] = filterLocales(value, selectedLocales, keepEmptyObjects)
    }
  }

  return result
}
