import type { Field } from './types.js'

import { username, validations } from '../validations.js'
import { fieldAffectsData } from './types.js'

const defaultValidators = new WeakSet<object>([...Object.values(validations), username])
const warnedFields = new WeakSet<Field>()

/** Warn after auth base fields are merged too, since they can supply the required flag. */
export const warnOnRequiredWithCustomValidate = ({
  field,
  fieldPath,
  hasCustomValidate = true,
  shouldWarn = true,
}: {
  field: Field
  fieldPath: string
  hasCustomValidate?: boolean
  shouldWarn?: boolean
}): void => {
  if (!fieldAffectsData(field)) {
    return
  }

  if (!hasCustomValidate && typeof field.validate === 'function') {
    defaultValidators.add(field.validate)
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
}
