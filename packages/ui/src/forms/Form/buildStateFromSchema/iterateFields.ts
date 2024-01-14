import type { TFunction } from '@payloadcms/translations'

import type { User } from 'payload/auth'
import type { Field as FieldSchema, SanitizedConfig, Data } from 'payload/types'
import type { Fields } from '../types'
import { fieldIsPresentationalOnly } from 'payload/types'
import { addFieldStatePromise } from './addFieldStatePromise'

type Args = {
  config: SanitizedConfig
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
  id,
  config,
  data,
  fields,
  fullData,
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
          id,
          config,
          data,
          field,
          fullData,
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
