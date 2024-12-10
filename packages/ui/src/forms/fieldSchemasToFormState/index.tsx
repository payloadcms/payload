import type {
  ClientFieldSchemaMap,
  Data,
  DocumentPreferences,
  Field,
  FieldSchemaMap,
  FormState,
  FormStateWithoutComponents,
  PayloadRequest,
  SanitizedFieldsPermissions,
} from 'payload'

import type { RenderFieldMethod } from './types.js'

import { calculateDefaultValues } from './calculateDefaultValues/index.js'
import { iterateFields } from './iterateFields.js'

type Args = {
  /**
   * The client field schema map is required for field rendering.
   * If fields should not be rendered (=> `renderFieldFn` is not provided),
   * then the client field schema map is not required.
   */
  clientFieldSchemaMap?: ClientFieldSchemaMap
  collectionSlug?: string
  data?: Data
  fields: Field[] | undefined
  /**
   * The field schema map is required for field rendering.
   * If fields should not be rendered (=> `renderFieldFn` is not provided),
   * then the field schema map is not required.
   */
  fieldSchemaMap: FieldSchemaMap | undefined
  /**
   * By default, the full data will be the data passed to the form state, without being narrowed down to the sub-fields.
   * In some cases, form state for sub fields will be generated independent from the parent form state. In these cases, the parent form state
   * is not available and the full data would be the partial sub data.
   *
   * With fullDataOverride, we can pass the real full data, which will be used for `fullData` instead of the data passed to the form state request.
   *
   * This is useful for lexical blocks, as block fields there are not part of the parent form state, yet we still want full data to be available.
   */
  fullDataOverride?: Data
  id?: number | string
  operation?: 'create' | 'update'
  permissions: SanitizedFieldsPermissions
  preferences: DocumentPreferences
  /**
   * Optionally accept the previous form state,
   * to be able to determine if custom fields need to be re-rendered.
   */
  previousFormState?: FormState
  /**
   * If renderAllFields is true, then no matter what is in previous form state,
   * all custom fields will be re-rendered.
   */
  renderAllFields: boolean
  renderFieldFn?: RenderFieldMethod
  req: PayloadRequest

  schemaPath: string
}

export const fieldSchemasToFormState = async (args: Args): Promise<FormState> => {
  if (!args.clientFieldSchemaMap && args.renderFieldFn) {
    console.warn(
      'clientFieldSchemaMap is not passed to fieldSchemasToFormState - this will reduce performance',
    )
  }
  const {
    id,
    clientFieldSchemaMap,
    collectionSlug,
    data = {},
    fields,
    fieldSchemaMap,
    fullDataOverride,
    operation,
    permissions,
    preferences,
    previousFormState,
    renderAllFields,
    renderFieldFn,
    req,
    schemaPath,
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

    const fullData = fullDataOverride ?? dataWithDefaultValues

    await iterateFields({
      id,
      addErrorPathToParent: null,
      clientFieldSchemaMap,
      collectionSlug,
      data: dataWithDefaultValues,
      fields,
      fieldSchemaMap,
      fullData,
      operation,
      parentIndexPath: '',
      parentPassesCondition: true,
      parentPath: '',
      parentSchemaPath: schemaPath,
      permissions,
      preferences,
      previousFormState,
      renderAllFields,
      renderFieldFn,
      req,
      state,
    })

    return state
  }

  return {}
}

export { iterateFields }
