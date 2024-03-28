import type {
  Data,
  DocumentPreferences,
  Field as FieldSchema,
  FormState,
  PayloadRequest,
} from 'payload/types'

import { iterateFields } from './iterateFields.js'

type Args = {
  data?: Data
  fieldSchema: FieldSchema[] | undefined
  id?: number | string
  operation?: 'create' | 'update'
  preferences: {
    [key: string]: unknown
  }
  req: PayloadRequest
  siblingData?: Data
}

export type BuildFormStateArgs = {
  collectionSlug?: string
  data?: Data
  docPreferences?: DocumentPreferences
  formState?: FormState
  globalSlug?: string
  id?: number | string
  operation?: 'create' | 'update'
  schemaPath: string
}

export const buildStateFromSchema = async (args: Args): Promise<FormState> => {
  const { id, data: fullData = {}, fieldSchema, operation, preferences, req } = args

  if (fieldSchema) {
    const state: FormState = {}

    await iterateFields({
      id,
      data: fullData,
      errorPaths: [],
      fields: fieldSchema,
      fullData,
      operation,
      parentPassesCondition: true,
      path: '',
      preferences,
      req,
      state,
    })

    return state
  }

  return {}
}
