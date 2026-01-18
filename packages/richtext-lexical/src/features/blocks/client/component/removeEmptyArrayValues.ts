'use client'
import type { FormState } from 'payload'

/**
 * By default, if an array field is empty, it will be included in the form state with a value of 0.
 * We do not need this behavior here, By setting `disableFormData` to true, we can prevent the field from being included in the form state
 * like that.
 * @param fields form state
 */
export function removeEmptyArrayValues({ fields }: { fields: FormState }): FormState {
  for (const key in fields) {
    const field = fields[key]
    if (Array.isArray(field?.rows) && 'value' in field) {
      field.disableFormData = true
    }
  }
  return fields
}
