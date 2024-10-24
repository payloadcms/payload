import type { Data, Field, TabAsField, User } from 'payload'

import { defaultValuePromise } from './promise.js'

type Args<T> = {
  data: T
  fields: (Field | TabAsField)[]
  id?: number | string
  locale: string | undefined
  siblingData: Data
  user: User
}

export const iterateFields = async <T>({
  id,
  data,
  fields,
  locale,
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
        siblingData,
        user,
      }),
    )
  })

  await Promise.all(promises)
}
