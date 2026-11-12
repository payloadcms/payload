import type { Field, ValidateOptions } from './types.js'

import { validateRequired } from '../validateRequired.js'
import { username, validations } from '../validations.js'
import { fieldAffectsData } from './types.js'

const defaultValidators = new WeakSet<object>([...Object.values(validations), username])
const requiredValidators = new WeakSet<object>()

/** Reusable after base-field merging, without rerunning field hooks or other sanitization. */
export const sanitizeFieldValidation = ({ field }: { field: Field }): Field => {
  if (!fieldAffectsData(field)) {
    return field
  }

  const hasCustomValidate =
    typeof field.validate === 'function' && !defaultValidators.has(field.validate)

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

  if (
    field.required &&
    (hasCustomValidate || field.type === 'slug') &&
    !('virtual' in field && field.virtual) &&
    field.validate &&
    !requiredValidators.has(field.validate)
  ) {
    const validate = field.validate

    field.validate = async (
      value: unknown,
      options: ValidateOptions<unknown, unknown, object, unknown>,
    ) => {
      const validationOptions = { ...field, ...options }
      // Native slugs are generated on save; background form validation runs before those hooks.
      if (field.type !== 'slug' || options.event !== 'onChange') {
        const requiredResult = await validateRequired(value, validationOptions)

        if (requiredResult !== true) {
          return requiredResult
        }
      }

      return validate(value as never, validationOptions as never)
    }

    requiredValidators.add(field.validate)
  }

  return field
}
