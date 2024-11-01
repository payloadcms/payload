import type {
  Data,
  DocumentPermissions,
  DocumentPreferences,
  Field as FieldSchema,
  FieldSchemaMap,
  FormState,
  FormStateWithoutComponents,
  PayloadRequest,
} from 'payload'

import type { AddFieldStatePromiseArgs } from './addFieldStatePromise.js'

import { addFieldStatePromise } from './addFieldStatePromise.js'
import { RenderFieldMethod } from './types.js'

type Args = {
  addErrorPathToParent: (fieldPath: string) => void
  /**
   * if any parents is localized, then the field is localized. @default false
   */
  anyParentLocalized?: boolean
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
  /**
   * Whether to omit parent fields in the state. @default false
   */
  omitParents?: boolean
  /**
   * operation is only needed for validation
   */
  operation: 'create' | 'update'
  parentIndexPath: string
  parentPassesCondition?: boolean
  parentPath: string
  parentSchemaPath: string
  permissions: DocumentPermissions['fields']
  preferences?: DocumentPreferences
  previousFormState: FormState
  renderAllFields: boolean
  req: PayloadRequest
  /**
   * Whether to skip checking the field's condition. @default false
   */
  skipConditionChecks?: boolean
  /**
   * Whether to skip validating the field. @default false
   */
  skipValidation?: boolean
  state?: FormStateWithoutComponents
  renderFieldMethod: RenderFieldMethod
}

/**
 * Flattens the fields schema and fields data
 */
export const iterateFields = async ({
  id,
  addErrorPathToParent: addErrorPathToParentArg,
  anyParentLocalized = false,
  collectionSlug,
  data,
  fields,
  fieldSchemaMap,
  filter,
  forceFullValue = false,
  fullData,
  includeSchema = false,
  omitParents = false,
  operation,
  parentIndexPath,
  parentPassesCondition = true,
  parentPath,
  parentSchemaPath,
  permissions,
  preferences,
  previousFormState,
  renderAllFields,
  req,
  renderFieldMethod,
  skipConditionChecks = false,
  skipValidation = false,
  state = {},
}: Args): Promise<void> => {
  const promises = []

  fields.forEach((field, fieldIndex) => {
    let passesCondition = true
    if (!skipConditionChecks) {
      passesCondition = Boolean(
        (field?.admin?.condition
          ? Boolean(field.admin.condition(fullData || {}, data || {}, { user: req.user }))
          : true) && parentPassesCondition,
      )
    }

    promises.push(
      addFieldStatePromise({
        id,
        addErrorPathToParent: addErrorPathToParentArg,
        anyParentLocalized,
        collectionSlug,
        data,
        field,
        fieldIndex,
        fieldSchemaMap,
        filter,
        forceFullValue,
        fullData,
        renderFieldMethod,
        includeSchema,
        omitParents,
        operation,
        parentIndexPath,
        parentPath,
        parentSchemaPath,
        passesCondition,
        permissions,
        preferences,
        previousFormState,
        renderAllFields,
        req,
        skipConditionChecks,
        skipValidation,
        state,
      }),
    )
  })

  await Promise.all(promises)
}
