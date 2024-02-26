import type { TFunction } from '@payloadcms/translations'
import type { User } from 'payload/auth'
import type { Locale } from 'payload/config'
import type { Data, DocumentPreferences, Field as FieldSchema } from 'payload/types'

import type { FormState } from '../../Form/types'

import { iterateFields } from './iterateFields'

type Args = {
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

export type BuildFormStateArgs = {
  data?: Data
  docPreferences: DocumentPreferences
  formState?: FormState
  id?: number | string
  operation?: 'create' | 'update'
  schemaPath: string
}

const buildStateFromSchema = async (args: Args): Promise<FormState> => {
  const { id, data: fullData = {}, fieldSchema, locale, operation, preferences, t, user } = args

  if (fieldSchema) {
    const state: FormState = {}

    await iterateFields({
      id,
      data: fullData,
      errorPaths: new Set(),
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
