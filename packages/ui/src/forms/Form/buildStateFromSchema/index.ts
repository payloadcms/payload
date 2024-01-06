import type { TFunction } from 'i18next'

import type { User } from 'payload/auth'
import type { Field as FieldSchema, PayloadRequest, SanitizedConfig } from 'payload/types'
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
  t: PayloadRequest['i18n']['t']
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
