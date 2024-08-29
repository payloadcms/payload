import type { FormState } from 'payload'

import { serialize } from 'object-to-formdata'
import { reduceFieldsToValues } from 'payload/shared'

export function createFormData(formState: FormState = {}, overrides: Record<string, any> = {}) {
  const data = reduceFieldsToValues(formState, true)
  const file = data?.file

  if (file) {
    delete data.file
  }

  const dataWithOverrides = {
    ...data,
    ...overrides,
  }

  const dataToSerialize = {
    _payload: JSON.stringify(dataWithOverrides),
    file,
  }

  return serialize(dataToSerialize, { indices: true, nullsAsUndefineds: false })
}
