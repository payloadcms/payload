import type { FormState } from 'payload'

import { serialize } from 'object-to-formdata'
import { reduceFieldsToValues } from 'payload/shared'

import type { UploadHandlersContext } from '../../../providers/UploadHandlers/index.js'

export async function createFormData(
  formState: FormState = {},
  overrides: Record<string, any> = {},
  uploadHandler: ReturnType<UploadHandlersContext['getUploadHandler']>,
) {
  const data = reduceFieldsToValues(formState, true)
  let file = data?.file

  if (file) {
    delete data.file
  }

  if (file && typeof uploadHandler === 'function') {
    file = JSON.stringify(
      await uploadHandler({
        docPrefix: typeof data?.prefix === 'string' ? data.prefix : undefined,
        file,
      }),
    )
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
