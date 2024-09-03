import type {
  Data,
  DocumentPreferences,
  Field as FieldSchema,
  FormState,
  PayloadRequest,
} from 'payload'

import { calculateDefaultValues } from './calculateDefaultValues/index.js'
import { iterateFields } from './iterateFields.js'

type Args = {
  collectionSlug?: string
  data?: Data
  fieldSchema: FieldSchema[] | undefined
  id?: number | string
  operation?: 'create' | 'update'
  preferences: DocumentPreferences
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
  locale?: string
  operation?: 'create' | 'update'
  returnLockStatus?: boolean
  schemaPath: string
  updateLastEdited?: boolean
}

export const buildStateFromSchema = async (args: Args): Promise<FormState> => {
  const { id, collectionSlug, data: fullData = {}, fieldSchema, operation, preferences, req } = args

  if (fieldSchema) {
    const state: FormState = {}

    const dataWithDefaultValues = await calculateDefaultValues({
      id,
      data: fullData,
      fields: fieldSchema,
      locale: req.locale,
      siblingData: fullData,
      user: req.user,
    })

    await iterateFields({
      id,
      addErrorPathToParent: null,
      collectionSlug,
      data: dataWithDefaultValues,
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

export { iterateFields }
