import type {
  Data,
  DocumentPreferences,
  Field as FieldSchema,
  FormState,
  PayloadRequest,
} from 'payload'

import type { RenderFieldFn } from '../../utilities/renderFields.js'

import { calculateDefaultValues } from './calculateDefaultValues/index.js'
import { iterateFields } from './iterateFields.js'

type Args = {
  collectionSlug?: string
  data?: Data
  fieldSchema: FieldSchema[] | undefined
  id?: number | string
  operation?: 'create' | 'update'
  preferences: DocumentPreferences
  renderField?: RenderFieldFn
  req: PayloadRequest
  siblingData?: Data
}

export const buildStateFromSchema = async (args: Args): Promise<FormState> => {
  const {
    id,
    collectionSlug,
    data: fullData = {},
    fieldSchema,
    operation,
    preferences,
    renderField,
    req,
  } = args

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
      renderField,
      req,
      state,
    })

    return state
  }

  return {}
}

export { iterateFields }
