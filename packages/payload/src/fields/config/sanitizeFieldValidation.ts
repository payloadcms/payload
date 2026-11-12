import type { Field, ValidateOptions } from './types.js'

import { username, validations } from '../validations.js'
import { fieldAffectsData } from './types.js'

const defaultValidators = new WeakSet<object>([...Object.values(validations), username])
const warnedFields = new WeakSet<Field>()

/** Also used after auth base fields are merged so inherited required flags are considered. */
export const sanitizeFieldValidation = ({
  field,
  fieldPath,
  shouldWarn = true,
}: {
  field: Field
  fieldPath: string
  shouldWarn?: boolean
}): Field => {
  if (!fieldAffectsData(field)) {
    return field
  }

  if (
    shouldWarn &&
    process.env.NODE_ENV === 'development' &&
    field.required &&
    typeof field.validate === 'function' &&
    !defaultValidators.has(field.validate) &&
    !('virtual' in field && field.virtual) &&
    !warnedFields.has(field)
  ) {
    console.warn(
      `[Payload] Field "${fieldPath}" has both required: true and a custom validate function. Custom validation replaces Payload's default validation, including the required check. If your validator does not already compose the default validator, call it to retain required validation. See https://payloadcms.com/docs/fields/overview#reusing-default-field-validations`,
    )
    warnedFields.add(field)
  }

  if (typeof field.validate === 'undefined') {
    const defaultValidate =
      'virtual' in field && field.virtual
        ? undefined
        : validations[field.type as keyof typeof validations]

    field.validate = defaultValidate
      ? (value: unknown, options: ValidateOptions<unknown, unknown, object, unknown>) =>
          defaultValidate(value as never, { ...field, ...options } as never)
      : (): true => true

    defaultValidators.add(field.validate)
  }

  return field
}
