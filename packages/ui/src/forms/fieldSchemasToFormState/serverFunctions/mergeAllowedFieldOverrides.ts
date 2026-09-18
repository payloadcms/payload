import type { Field } from 'payload'

/**
 * Merges the allowed field overrides: `name`, `label`, and `admin.hidden`.
 * Each property is validated below and applied only to field types that support it.
 * All other configuration, including component references and props, stays server-owned.
 * Returns the resulting field without mutating the configured field.
 */
export const mergeAllowedFieldOverrides = ({
  overrides,
  targetField,
}: {
  overrides: unknown
  targetField: Field
}): Field => {
  if (!isRecord(overrides)) {
    return targetField
  }

  const field = { ...targetField }

  if ('name' in field && typeof overrides.name === 'string' && overrides.name.length > 0) {
    field.name = overrides.name
  }

  if (
    field.type !== 'row' &&
    field.type !== 'tabs' &&
    field.type !== 'ui' &&
    isLabel(overrides.label)
  ) {
    field.label = overrides.label
  }

  if (
    field.type !== 'ui' &&
    isRecord(overrides.admin) &&
    typeof overrides.admin.hidden === 'boolean'
  ) {
    field.admin = { ...field.admin, hidden: overrides.admin.hidden }
  }

  return field
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isLabel = (value: unknown): value is false | Record<string, string> | string =>
  value === false ||
  typeof value === 'string' ||
  (isRecord(value) && Object.values(value).every((translation) => typeof translation === 'string'))
