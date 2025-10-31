import type {
  BuildFormStateArgs,
  ClientFieldSchemaMap,
  Data,
  DocumentPreferences,
  FieldBuilder,
  Field as FieldSchema,
  FieldSchemaMap,
  FormState,
  FormStateWithoutComponents,
  PayloadRequest,
  RootBuilder,
  SanitizedFieldsPermissions,
  SelectMode,
  SelectType,
} from 'payload'

import type { AddFieldStatePromiseArgs } from './addFieldStatePromise.js'
import type { RenderFieldMethod } from './types.js'

import { addFieldStatePromise } from './addFieldStatePromise.js'

type Args = {
  addErrorPathToParent: (fieldPath: string) => void
  /**
   * if any parents is localized, then the field is localized. @default false
   */
  anyParentLocalized?: boolean
  /**
   * Data of the nearest parent block, or undefined
   */
  blockData: Data | undefined
  clientFieldSchemaMap?: ClientFieldSchemaMap
  collectionSlug?: string
  data: Data
  fields: FieldSchema[]
  fieldSchemaMap: FieldSchemaMap
  filter?: (args: AddFieldStatePromiseArgs) => boolean
  /**
   * Force the value of fields like arrays or blocks to be the full value instead of the length @default false
   */
  forceFullValue?: boolean
  fullData: Data
  id?: number | string
  /**
   * Whether the field schema should be included in the state. @default false
   */
  includeSchema?: boolean
  mockRSCs?: BuildFormStateArgs['mockRSCs']
  /**
   * Whether to omit parent fields in the state. @default false
   */
  omitParents?: boolean
  /**
   * operation is only needed for validation
   */
  operation: 'create' | 'update'
  parentPassesCondition?: boolean
  parentPath: FieldBuilder | RootBuilder
  permissions: SanitizedFieldsPermissions
  preferences?: DocumentPreferences
  previousFormState: FormState
  readOnly?: boolean
  renderAllFields: boolean
  renderFieldFn: RenderFieldMethod
  req: PayloadRequest
  select?: SelectType
  selectMode?: SelectMode
  /**
   * Whether to skip checking the field's condition. @default false
   */
  skipConditionChecks?: boolean
  /**
   * Whether to skip validating the field. @default false
   */
  skipValidation?: boolean
  state?: FormStateWithoutComponents
}

/**
 * Flattens the fields schema and fields data
 */
export const iterateFields = async ({
  id,
  addErrorPathToParent: addErrorPathToParentArg,
  anyParentLocalized = false,
  blockData,
  clientFieldSchemaMap,
  collectionSlug,
  data,
  fields,
  fieldSchemaMap,
  filter,
  forceFullValue = false,
  fullData,
  includeSchema = false,
  mockRSCs,
  omitParents = false,
  operation,
  parentPassesCondition = true,
  parentPath,
  permissions,
  preferences,
  previousFormState,
  readOnly,
  renderAllFields,
  renderFieldFn: renderFieldFn,
  req,
  select,
  selectMode,
  skipConditionChecks = false,
  skipValidation = false,
  state = {},
}: Args): Promise<void> => {
  const promises = []

  fields.forEach((field, fieldIndex) => {
    promises.push(
      addFieldStatePromise({
        id,
        addErrorPathToParent: addErrorPathToParentArg,
        anyParentLocalized,
        blockData,
        clientFieldSchemaMap,
        collectionSlug,
        data,
        field,
        fieldIndex,
        fieldSchemaMap,
        filter,
        forceFullValue,
        fullData,
        includeSchema,
        mockRSCs,
        omitParents,
        operation,
        parentPassesCondition,
        parentPath,
        parentPermissions: permissions,
        preferences,
        previousFormState,
        readOnly,
        renderAllFields,
        renderFieldFn,
        req,
        select,
        selectMode,
        skipConditionChecks,
        skipValidation,
        state,
      }),
    )
  })

  await Promise.all(promises)
}
