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
  skipValidation?: boolean
  /**
   * If this is undefined, the `data` passed to this function will serve as `fullData`, `data` and `topLevelData` when iterating over
   * the top-level-fields to generate form state.
   * For sub fields, the `data` will be narrowed down to the sub fields, while `fullData` and `topLevelData` remain the same.
   *
   * Usually, the `data` passed to this function will be the document data. This means that running validation, read access control
   * or executing filterOptions here will have access to the full document through the passed `fullData` parameter, and that `fullData` and `topLevelData` will be identical.
   *
   * In some cases however, this function is used to generate form state solely for sub fields - independent from the parent form state.
   * This means that `data` will be the form state of the sub fields - the document data won't be available here.
   *
   * In these cases, we can use `topLevelData` to pass the full document data, which will be available as `topLevelData` in validation,
   * read access control and filterOptions.
   *
   * This is useful for lexical blocks, as lexical block fields there are not part of the parent form state, yet we still want
   * document data to be available for validation and filterOptions, under the `topLevelData` key.
   * In this case, `fullData` and `topLevelData` will no longer be identical.
   */
  topLevelData?: Data
}

export const fieldSchemasToFormState = async ({
  id,
  clientFieldSchemaMap,
  collectionSlug,
  data = {},
  fields,
  fieldSchemaMap,
  operation,
  permissions,
  preferences,
  previousFormState,
  renderAllFields,
  renderFieldFn,
  req,
  schemaPath,
  skipValidation,
  topLevelData,
}: Args): Promise<FormState> => {
  if (!clientFieldSchemaMap && renderFieldFn) {
    console.warn(
      'clientFieldSchemaMap is not passed to fieldSchemasToFormState - this will reduce performance',
    )
  }

  if (fields && fields.length) {
    const state: FormStateWithoutComponents = {}

    const dataWithDefaultValues = { ...data }

    await calculateDefaultValues({
      id,
      data: dataWithDefaultValues,
      fields,
      locale: req.locale,
      req,
      siblingData: dataWithDefaultValues,
      user: req.user,
    })

    const fullData = dataWithDefaultValues

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
      skipValidation,
      state,
      topLevelData: topLevelData ?? fullData,
    })

    return state
  }

  return {}
}

export { iterateFields }
