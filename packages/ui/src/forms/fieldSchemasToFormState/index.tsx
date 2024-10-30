import type {
  Data,
  DocumentPreferences,
  Field,
  FormStateWithoutComponents,
  PayloadRequest,
} from 'payload'

import { calculateDefaultValues } from './calculateDefaultValues/index.js'
import { iterateFields } from './iterateFields.js'

type Args = {
  collectionSlug?: string
  data?: Data
  fields: Field[] | undefined
  id?: number | string
  operation?: 'create' | 'update'
  parentPath?: (number | string)[]
  parentSchemaPath?: string[]
  preferences: DocumentPreferences
  req: PayloadRequest
  /**
   * If set, fields with these schema paths will have requireRender: true set in their form state.
   * This is useful for them to be later processed by attachComponentsToFormState, if schemaPathsToRender is
   * calculated earlier from the existing form state passed to buildFormState.
   *
   * If set to true, all fields will have requireRender: true set in their form state.
   */
  schemaPathsToRender?: string[] | true
  siblingData?: Data
}

export const fieldSchemasToFormState = async (args: Args): Promise<FormStateWithoutComponents> => {
  const {
    id,
    collectionSlug,
    data = {},
    fields,
    operation,
    parentPath = [],
    parentSchemaPath = [],
    preferences,
    req,
    schemaPathsToRender,
  } = args

  if (fields && fields.length) {
    const state: FormStateWithoutComponents = {}

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
      parentPath,
      parentSchemaPath,
      preferences,
      req,
      schemaPathsToRender,
      state,
    })

    return state
  }

  return {}
}

export { iterateFields }
