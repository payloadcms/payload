import type { TFunction } from '@payloadcms/translations'

import type { User } from 'payload/auth'
import type { Field as FieldSchema, Data } from 'payload/types'
import type { FormState } from '../../Form/types'
import { fieldIsPresentationalOnly } from 'payload/types'
import { addFieldStatePromise } from './addFieldStatePromise'

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
  state: FormState
  t: TFunction
  user: User
  errorPaths: Set<string>
}

export const iterateFields = async ({
  id,
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
  errorPaths,
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
          errorPaths,
        }),
      )
    }
  })

  await Promise.all(promises)
}
