import type { Data, Field, PayloadRequest, TabAsField } from 'payload/types'

import { defaultValuePromise } from './promise.js'

type Args<T> = {
  data: T
  fields: (Field | TabAsField)[]
  id?: number | string
  req: PayloadRequest
  siblingData: Data
}

export const iterateFields = async <T>({
  id,
  data,
  fields,
  req,
  siblingData,
}: Args<T>): Promise<void> => {
  const promises = []
  fields.forEach((field) => {
    promises.push(
      defaultValuePromise({
        id,
        data,
        field,
        req,
        siblingData,
      }),
    )
  })
  await Promise.all(promises)
}
