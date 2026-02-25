import type { CollectionSlug, FormState } from 'payload'

import { serialize } from 'object-to-formdata'
import { reduceFieldsToValues } from 'payload/shared'

import type { UploadHandlersContext } from '../../../providers/UploadHandlers/index.js'

export async function createFormData(
  formState: FormState = {},
  overrides: Record<string, any> = {},
  collectionSlug: CollectionSlug,
  uploadHandler: ReturnType<UploadHandlersContext['getUploadHandler']>,
) {
  const data = reduceFieldsToValues(formState, true)
  let file = data?.file

  if (file) {
    delete data.file
  }

  if (file && typeof uploadHandler === 'function') {
    let filename = file.name

    const clientUploadContext = await uploadHandler({
      file,
      updateFilename: (value) => {
        filename = value
      },
    })

    file = JSON.stringify({
      clientUploadContext,
      collectionSlug,
      filename,
      mimeType: file.type,
      size: file.size,
    })
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
