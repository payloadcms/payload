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
  fields: FieldSchema[] | undefined
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
    fields,
    operation,
    preferences,
    renderField,
    req,
  } = args

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
      renderField,
      req,
      schemaPath: '',
      state,
    })

    return state
  }

  return {}
}

export { iterateFields }
