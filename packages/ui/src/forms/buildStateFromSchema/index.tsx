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
  const { id, collectionSlug, data: fullData = {}, fields, operation, preferences, req } = args

  if (fields) {
    const state: FormState = {}

    const dataWithDefaultValues = await calculateDefaultValues({
      id,
      data: fullData,
      fields,
      locale: req.locale,
      siblingData: fullData,
      user: req.user,
    })

    await iterateFields({
      id,
      addErrorPathToParent: null,
      collectionSlug,
      data: dataWithDefaultValues,
      fields,
      fullData,
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
