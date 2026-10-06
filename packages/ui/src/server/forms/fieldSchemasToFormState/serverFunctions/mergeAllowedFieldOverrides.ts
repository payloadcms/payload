import type { Field } from 'payload'

/**
 * Merges the allowed field overrides: `name`, `label`, and `admin.hidden`.
 * Each property is validated and applied only to field types that support it.
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
  const overridesArg = { value: overrides }

  if (!isRecord(overridesArg)) {
    return targetField
  }

  const field = { ...targetField }
  const presentationOverrides = overridesArg.value

  if (
    'name' in field &&
    typeof presentationOverrides.name === 'string' &&
    presentationOverrides.name.length > 0
  ) {
    field.name = presentationOverrides.name
  }

  const labelArg = { value: presentationOverrides.label }

  if (field.type !== 'row' && field.type !== 'tabs' && field.type !== 'ui' && isLabel(labelArg)) {
    field.label = labelArg.value
  }

  const adminArg = { value: presentationOverrides.admin }

  if (field.type !== 'ui' && isRecord(adminArg) && typeof adminArg.value.hidden === 'boolean') {
    field.admin = { ...field.admin, hidden: adminArg.value.hidden }
  }

  return field
}

type ValueArg = { value: unknown }

const isRecord = (args: ValueArg): args is { value: Record<string, unknown> } =>
  args.value !== null && typeof args.value === 'object' && !Array.isArray(args.value)

const isLabel = (args: ValueArg): args is { value: false | Record<string, string> | string } =>
  args.value === false ||
  typeof args.value === 'string' ||
  (isRecord(args) &&
    Object.values(args.value).every((translation) => typeof translation === 'string'))
