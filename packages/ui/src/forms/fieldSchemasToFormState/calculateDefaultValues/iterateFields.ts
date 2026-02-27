import type { CalculateDefaultValuesIterateFieldsArgs } from 'payload/internal'

import { defaultValuePromise } from './promise.js'

export const iterateFields = async <TData>({
  id,
  data,
  fields,
  locale,
  req,
  select,
  selectMode,
  siblingData,
  user,
}: CalculateDefaultValuesIterateFieldsArgs<TData>): Promise<void> => {
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
