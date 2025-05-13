import type { Data, Field, PayloadRequest, SelectMode, SelectType, TabAsField, User } from 'payload'

import { defaultValuePromise } from './promise.js'

type Args<T> = {
  data: T
  fields: (Field | TabAsField)[]
  id?: number | string
  locale: string | undefined
  req: PayloadRequest
  select?: SelectType
  selectMode?: SelectMode
  siblingData: Data
  user: User
}

export const iterateFields = async <T>({
  id,
  data,
  fields,
  locale,
  req,
  select,
  selectMode,
  siblingData,
  user,
}: Args<T>): Promise<void> => {
  const promises = []

  fields.forEach((field) => {
    promises.push(
      defaultValuePromise({
        id,
        data,
        field,
        locale,
        req,
        select,
        selectMode,
        siblingData,
        user,
      }),
    )
  })

  await Promise.all(promises)
}
