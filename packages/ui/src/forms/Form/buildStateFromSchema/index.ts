import type { TFunction } from '@payloadcms/translations'

import type { User } from 'payload/auth'
import type { Field as FieldSchema, Data, SanitizedConfig } from 'payload/types'
import type { FormState } from '../types'

import { iterateFields } from './iterateFields'
import { Locale } from 'payload/config'

type Args = {
  config: SanitizedConfig
  data?: Data
  fieldSchema: FieldSchema[] | undefined
  id?: number | string
  locale: Locale['code']
  operation?: 'create' | 'update'
  preferences: {
    [key: string]: unknown
  }
  siblingData?: Data
  t: TFunction
  user?: User | null
}

const buildStateFromSchema = async (args: Args): Promise<FormState> => {
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
    const state: FormState = {}

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
