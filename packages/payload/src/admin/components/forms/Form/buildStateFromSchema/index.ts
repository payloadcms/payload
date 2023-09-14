import type { TFunction } from 'i18next'

import type { User } from '../../../../../auth'
import type { Field as FieldSchema } from '../../../../../fields/config/types'
import type { Data, Fields } from '../types'

import { iterateFields } from './iterateFields'

type Args = {
  data?: Data
  fieldSchema: FieldSchema[]
  id?: number | string
  locale: string
  operation?: 'create' | 'update'
  preferences: {
    [key: string]: unknown
  }
  siblingData?: Data
  t: TFunction
  user?: User
}

const buildStateFromSchema = async (args: Args): Promise<Fields> => {
  const { data: fullData = {}, fieldSchema, id, locale, operation, preferences, t, user } = args

  if (fieldSchema) {
    const state: Fields = {}

    await iterateFields({
      data: fullData,
      fields: fieldSchema,
      fullData,
      id,
      locale,
      operation,
      parentPassesCondition: true,
      path: '',
      preferences,
      state,
      t,
      user,
    })

    return state
  }

  return {}
}

export default buildStateFromSchema
