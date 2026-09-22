import type { CollectionSlug, FormState } from 'payload'

import { serialize } from 'object-to-formdata'
import { reduceFieldsToValues, uploadRequiresServerValidation } from 'payload/shared'

import type { UploadHandlersContext } from '../../../providers/UploadHandlers/index.js'

export async function createFormData(
  formState: FormState = {},
  overrides: Record<string, any> = {},
  collectionSlug: CollectionSlug,
  uploadHandler: ReturnType<UploadHandlersContext['getUploadHandler']>,
  allowRestrictedFileTypes?: boolean,
) {
  const data = reduceFieldsToValues(formState, true)
  let file = data?.file

  if (file) {
    delete data.file
  }

  if (
    file &&
    typeof uploadHandler === 'function' &&
    !uploadRequiresServerValidation({
      allowRestrictedFileTypes,
      filename: file.name,
      mimeType: file.type,
    })
  ) {
    let filename = file.name

    const clientUploadContext = await uploadHandler({
      docPrefix: typeof data?.prefix === 'string' ? data.prefix : undefined,
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
