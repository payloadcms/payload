import type {
  BuildFormStateArgs,
  ClientFieldSchemaMap,
  Data,
  DocumentPreferences,
  Field,
  FieldSchemaMap,
  FieldState,
  FormState,
  FormStateWithoutComponents,
  PayloadRequest,
  SanitizedFieldsPermissions,
  SelectMode,
  SelectType,
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
  /**
   * If this is undefined, the `data` passed to this function will serve as `fullData` and `data` when iterating over
   * the top-level-fields to generate form state.
   * For sub fields, the `data` will be narrowed down to the sub fields, while `fullData` remains the same.
   *
   * Usually, the `data` passed to this function will be the document data. This means that running validation, read access control
   * or executing filterOptions here will have access to the full document through the passed `fullData` parameter, and that `fullData` and `data` will be identical.
   *
   * In some cases however, this function is used to generate form state solely for sub fields - independent from the parent form state.
   * This means that `data` will be the form state of the sub fields - the document data won't be available here.
   *
   * In these cases, you can pass `documentData` which will be used as `fullData` instead of `data`.
   *
   * This is useful for lexical blocks, as lexical block fields there are not part of the parent form state, yet we still want
   * document data to be available for validation and filterOptions, under the `data` key.
   */
  documentData?: Data
  fields: Field[] | undefined
  /**
   * The field schema map is required for field rendering.
   * If fields should not be rendered (=> `renderFieldFn` is not provided),
   * then the field schema map is not required.
   */
  fieldSchemaMap: FieldSchemaMap | undefined
  id?: number | string
  /**
   * Validation, filterOptions and read access control will receive the `blockData`, which is the data of the nearest parent block. You can pass in
   * the initial block data here, which will be used as `blockData` for the top-level fields, until the first block is encountered.
   */
  initialBlockData?: Data
  mockRSCs?: BuildFormStateArgs['mockRSCs']
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
  select?: SelectType
  selectMode?: SelectMode
  skipValidation?: boolean
}

export const fieldSchemasToFormState = async ({
  id,
  clientFieldSchemaMap,
  collectionSlug,
  data = {},
  documentData,
  fields,
  fieldSchemaMap,
  initialBlockData,
  mockRSCs,
  operation,
  permissions,
  preferences,
  previousFormState,
  renderAllFields,
  renderFieldFn,
  req,
  schemaPath,
  select,
  selectMode,
  skipValidation,
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
      select,
      selectMode,
      siblingData: dataWithDefaultValues,
      user: req.user,
    })

    let fullData = dataWithDefaultValues

    if (documentData) {
      // By the time this function is used to get form state for nested forms, their default values should have already been calculated
      // => no need to run calculateDefaultValues here
      fullData = documentData
    }

    await iterateFields({
      id,
      addErrorPathToParent: null,
      blockData: initialBlockData,
      clientFieldSchemaMap,
      collectionSlug,
      data: dataWithDefaultValues,
      fields,
      fieldSchemaMap,
      fullData,
      mockRSCs,
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
      select,
      selectMode,
      skipValidation,
      state,
    })

    return state
  }

  return {}
}

export { iterateFields }
