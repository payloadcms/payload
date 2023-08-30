import type { TFunction } from 'i18next'

import type { User } from '../../../../../auth/types.js'
import type { Field as FieldSchema } from '../../../../../fields/config/types.js'
import type { Data, Fields } from '../types.js'

import { fieldIsPresentationalOnly } from '../../../../../fields/config/types.js'
import { addFieldStatePromise } from './addFieldStatePromise.js'

type Args = {
  data: Data
  fields: FieldSchema[]
  fullData: Data
  id: number | string
  locale: string
  operation: 'create' | 'update'
  parentPassesCondition: boolean
  path: string
  preferences: {
    [key: string]: unknown
  }
  state: Fields
  t: TFunction
  user: User
}

export const iterateFields = async ({
  data,
  fields,
  fullData,
  id,
  locale,
  operation,
  parentPassesCondition,
  path = '',
  preferences,
  state,
  t,
  user,
}: Args): Promise<void> => {
  const promises = []
  fields.forEach((field) => {
    const initialData = data
    if (!fieldIsPresentationalOnly(field) && !field?.admin?.disabled) {
      const passesCondition = Boolean(
        (field?.admin?.condition
          ? field.admin.condition(fullData || {}, initialData || {}, { user })
          : true) && parentPassesCondition,
      )

      promises.push(
        addFieldStatePromise({
          data,
          field,
          fullData,
          id,
          locale,
          operation,
          passesCondition,
          path,
          preferences,
          state,
          t,
          user,
        }),
      )
    }
  })
  await Promise.all(promises)
}
