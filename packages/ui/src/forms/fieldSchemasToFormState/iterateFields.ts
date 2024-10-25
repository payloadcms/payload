import type {
  Data,
  DocumentPreferences,
  Field as FieldSchema,
  FormStateWithoutComponents,
  PayloadRequest,
} from 'payload'

import type { AddFieldStatePromiseArgs } from './addFieldStatePromise.js'

import { addFieldStatePromise } from './addFieldStatePromise.js'

type Args = {
  addErrorPathToParent: (fieldPath: (number | string)[]) => void
  /**
   * if any parents is localized, then the field is localized. @default false
   */
  anyParentLocalized?: boolean
  collectionSlug?: string
  data: Data
  fields: FieldSchema[]
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
  parentPassesCondition?: boolean
  /**
   * The initial path of the field. @default []
   */
  parentPath?: (number | string)[]
  /**
   * The initial schema path of the field. @default []
   */
  parentSchemaPath?: string[]
  preferences?: DocumentPreferences
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
  filter,
  forceFullValue = false,
  fullData,
  includeSchema = false,
  omitParents = false,
  operation,
  parentPassesCondition = true,
  parentPath = [],
  parentSchemaPath = [],
  preferences,
  req,
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
        filter,
        forceFullValue,
        fullData,
        includeSchema,
        omitParents,
        operation,
        parentPath,
        parentSchemaPath,
        passesCondition,
        preferences,
        req,
        skipConditionChecks,
        skipValidation,
        state,
      }),
    )
  })

  await Promise.all(promises)
}
