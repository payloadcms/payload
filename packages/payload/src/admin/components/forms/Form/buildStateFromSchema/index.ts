import type { TFunction } from 'i18next'

import type { User } from '../../../../../auth'
import type { SanitizedConfig } from '../../../../../config/types'
import type { Field as FieldSchema } from '../../../../../fields/config/types'
import type { Data, Fields } from '../types'

import { iterateFields } from './iterateFields'

type Args = {
  config: SanitizedConfig
  data?: Data
  fieldSchema: FieldSchema[] | undefined
  id?: number | string
  locale: string
  operation?: 'create' | 'update'
  preferences: {
    [key: string]: unknown
  }
  siblingData?: Data
  t: TFunction
  user?: User | null
}

const buildStateFromSchema = async (args: Args): Promise<Fields> => {
  const {
    id,
    config,
    data: fullData = {},
    fieldSchema,
    locale,
    operation,
    preferences,
    t,
    user,
  } = args

  if (fieldSchema) {
    const state: Fields = {}

    await iterateFields({
      id,
      config,
      data: fullData,
      fields: fieldSchema,
      fullData,
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
