import type { Data, DocumentPreferences, Field, FormState, PayloadRequest } from 'payload'

import { calculateDefaultValues } from './calculateDefaultValues/index.js'
import { iterateFields } from './iterateFields.js'

type Args = {
  collectionSlug?: string
  data?: Data
  fields: Field[] | undefined
  id?: number | string
  operation?: 'create' | 'update'
  preferences: DocumentPreferences
  req: PayloadRequest
  siblingData?: Data
}

export const buildStateFromSchema = async (args: Args): Promise<FormState> => {
  const { id, collectionSlug, data = {}, fields, operation, preferences, req } = args

  if (fields) {
    const state: FormState = {}

    const dataWithDefaultValues = { ...data }

    await calculateDefaultValues({
      id,
      data: dataWithDefaultValues,
      fields,
      locale: req.locale,
      siblingData: dataWithDefaultValues,
      user: req.user,
    })

    await iterateFields({
      id,
      addErrorPathToParent: null,
      collectionSlug,
      data: dataWithDefaultValues,
      fields,
      fullData: data,
      operation,
      parentPassesCondition: true,
      path: '',
      preferences,
      req,
      schemaPath: '',
      state,
    })

    return state
  }

  return {}
}

export { iterateFields }
