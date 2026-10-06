import type { ClientField, Field } from 'payload'

import { fieldAffectsData, fieldHasSubFields, tabHasName } from 'payload/shared'

type AnyField = ClientField | Field

function isLocalized(field: AnyField): boolean {
  return 'localized' in field && Boolean(field.localized)
}

function getObjectValue(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/**
 * Extracts locale-specific data from widget data stored in preferences.
 *
 * Localized fields are stored as `{ fieldName: { en: "Hello", de: "Hallo" } }` in preferences.
 * This function flattens them to `{ fieldName: "Hello" }` for the given locale,
 * which is the format the form state builder expects.
 *
 * Recursively handles nested field types (group, row, collapsible, tabs).
 */
export function extractLocaleData(
  widgetData: Record<string, unknown>,
  locale: string,
  fields: readonly AnyField[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const tabFields = tab.fields as AnyField[]
        if (tabHasName(tab)) {
          result[tab.name] = extractLocaleData(
            getObjectValue(widgetData[tab.name]),
            locale,
            tabFields,
          )
        } else {
          Object.assign(result, extractLocaleData(widgetData, locale, tabFields))
        }
      }
      continue
    }

    if (fieldHasSubFields(field) && !fieldAffectsData(field)) {
      Object.assign(result, extractLocaleData(widgetData, locale, field.fields as AnyField[]))
      continue
    }

    if (!fieldAffectsData(field)) {
      continue
    }

    const { name } = field
    const value = widgetData[name]

    if (fieldHasSubFields(field)) {
      result[name] = extractLocaleData(getObjectValue(value), locale, field.fields as AnyField[])
      continue
    }

    if (
      isLocalized(field) &&
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
 *
 * Recursively handles nested field types (group, row, collapsible, tabs).
 */
export function mergeLocaleData(
  existingData: Record<string, unknown>,
  formData: Record<string, unknown>,
  locale: string,
  fields: readonly AnyField[],
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...existingData }

  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const tabFields = tab.fields as AnyField[]
        if (tabHasName(tab)) {
          result[tab.name] = mergeLocaleData(
            getObjectValue(result[tab.name]),
            getObjectValue(formData[tab.name]),
            locale,
            tabFields,
          )
        } else {
          Object.assign(result, mergeLocaleData(result, formData, locale, tabFields))
        }
      }
      continue
    }

    if (fieldHasSubFields(field) && !fieldAffectsData(field)) {
      Object.assign(result, mergeLocaleData(result, formData, locale, field.fields as AnyField[]))
      continue
    }

    if (!fieldAffectsData(field)) {
      continue
    }

    const { name } = field

    if (fieldHasSubFields(field)) {
      result[name] = mergeLocaleData(
        getObjectValue(result[name]),
        getObjectValue(formData[name]),
        locale,
        field.fields as AnyField[],
      )
      continue
    }

    if (isLocalized(field)) {
      result[name] = { ...getObjectValue(result[name]), [locale]: formData[name] }
    } else {
      result[name] = formData[name]
    }
  }

  return result
}
