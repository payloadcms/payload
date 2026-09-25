import type { TypedFallbackLocale } from '../../index.js'

type GetLocalizedValueArgs = {
  /**
   * Fallback locale(s) to use if the requested locale has no value
   */
  fallbackLocale?: TypedFallbackLocale
  /**
   * The field type - affects empty value handling for text/textarea fields
   */
  fieldType?: 'text' | 'textarea' | string
  /**
   * The requested locale
   */
  locale: string
  /**
   * The localized value object (e.g., { en: "Home", es: "", de: "Startseite" })
   * Can also be a non-localized value (string/number), which is returned as-is
   */
  value: any | Record<string, any>
}

/**
 * Extracts a value from a localized field object, with fallback locale support.
 * Mirrors Payload's internal afterRead behavior for localized fields.
 *
 * @param args - Configuration for value extraction
 * @returns The field value for the requested locale, or fallback if not available
 */
export function getLocalizedValue({
  fallbackLocale,
  fieldType,
  locale,
  value,
}: GetLocalizedValueArgs): any {
  // If value is not an object (non-localized field), return it as-is
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value
  }

  // Get the requested locale's value
  const requestedValue = value[locale]

  // Determine if we should use fallback
  const isNullOrUndefined = typeof requestedValue === 'undefined' || requestedValue === null

  // For text/textarea fields, empty string also triggers fallback
  const shouldUseFallback =
    fieldType === 'text' || fieldType === 'textarea'
      ? requestedValue === '' || isNullOrUndefined
      : isNullOrUndefined

  if (!shouldUseFallback) {
    return requestedValue
  }

  // No fallback configured, return the (potentially empty) requested value
  if (
    !fallbackLocale ||
    fallbackLocale === 'null' ||
    fallbackLocale === 'none' ||
    fallbackLocale === 'false'
  ) {
    return requestedValue
  }

  // Handle array of fallback locales
  if (Array.isArray(fallbackLocale)) {
    for (const fallbackLoc of fallbackLocale) {
      const fallbackValue = value[fallbackLoc]
      // Check if fallback value is non-empty
      if (fallbackValue !== undefined && fallbackValue !== null && fallbackValue !== '') {
        return fallbackValue
      }
    }
    // No fallback had a value, return requested value
    return requestedValue
  }

  // Single fallback locale
  const fallbackValue = value[fallbackLocale]
  if (fallbackValue !== undefined && fallbackValue !== null && fallbackValue !== '') {
    return fallbackValue
  }

  // Fallback didn't have a value either, return requested value
  return requestedValue
}
