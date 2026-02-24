/**
 * Extracts locale-specific data from widget data stored in preferences.
 *
 * Localized fields are stored as `{ fieldName: { en: "Hello", de: "Hallo" } }` in preferences.
 * This function flattens them to `{ fieldName: "Hello" }` for the given locale,
 * which is the format the form state builder expects.
 */
export function extractLocaleData(
  widgetData: Record<string, unknown>,
  locale: string,
  fields: readonly object[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const field of fields) {
    if (!('name' in field) || typeof (field as any).name !== 'string') {
      continue
    }

    const name = (field as any).name as string
    const value = widgetData[name]

    if (
      'localized' in field &&
      (field as any).localized &&
      value !== undefined &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      result[name] = (value as Record<string, unknown>)[locale]
    } else {
      result[name] = value
    }
  }

  return result
}

/**
 * Merges locale-specific form data back into the full widget data structure.
 *
 * Non-localized fields are stored directly. Localized fields are stored as
 * `{ fieldName: { en: "Hello", de: "Hallo" } }` so each locale's value is preserved independently.
 */
export function mergeLocaleData(
  existingData: Record<string, unknown>,
  formData: Record<string, unknown>,
  locale: string,
  fields: readonly object[],
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...existingData }

  for (const field of fields) {
    if (!('name' in field) || typeof (field as any).name !== 'string') {
      continue
    }

    const name = (field as any).name as string

    if ('localized' in field && (field as any).localized) {
      const existing =
        typeof result[name] === 'object' && result[name] !== null && !Array.isArray(result[name])
          ? (result[name] as Record<string, unknown>)
          : {}
      result[name] = { ...existing, [locale]: formData[name] }
    } else {
      result[name] = formData[name]
    }
  }

  return result
}
