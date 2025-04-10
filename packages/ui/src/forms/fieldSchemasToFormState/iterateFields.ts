import type {
  BuildFormStateArgs,
  ClientFieldSchemaMap,
  Data,
  DocumentPreferences,
  Field as FieldSchema,
  FieldSchemaMap,
  FieldState,
  FormState,
  FormStateWithoutComponents,
  PayloadRequest,
  SanitizedFieldsPermissions,
  SelectMode,
  SelectType,
} from 'payload'

import { stripUnselectedFields } from 'payload'
import { getFieldPaths } from 'payload/shared'

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
  parentIndexPath: string
  parentPassesCondition?: boolean
  parentPath: string
  parentSchemaPath: string
  permissions: SanitizedFieldsPermissions
  preferences?: DocumentPreferences
  previousFormState: FormState
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
  parentIndexPath,
  parentPassesCondition = true,
  parentPath,
  parentSchemaPath,
  permissions,
  preferences,
  previousFormState,
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
    let passesCondition = true

    const { indexPath, path, schemaPath } = getFieldPaths({
      field,
      index: fieldIndex,
      parentIndexPath: 'name' in field ? '' : parentIndexPath,
      parentPath,
      parentSchemaPath,
    })

    if (path !== 'id') {
      const shouldContinue = stripUnselectedFields({
        field,
        select,
        selectMode,
        siblingDoc: data,
      })

      if (!shouldContinue) {
        return
      }
    }

    const pathSegments = path ? path.split('.') : []

    if (!skipConditionChecks) {
      try {
        passesCondition = Boolean(
          (field?.admin?.condition
            ? Boolean(
                field.admin.condition(fullData || {}, data || {}, {
                  blockData,
                  path: pathSegments,
                  user: req.user,
                }),
              )
            : true) && parentPassesCondition,
        )
      } catch (err) {
        passesCondition = false

        req.payload.logger.error({
          err,
          msg: `Error evaluating field condition at path: ${path}`,
        })
      }
    }

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
        indexPath,
        mockRSCs,
        omitParents,
        operation,
        parentIndexPath,
        parentPath,
        parentPermissions: permissions,
        parentSchemaPath,
        passesCondition,
        path,
        preferences,
        previousFormState,
        renderAllFields,
        renderFieldFn,
        req,
        schemaPath,
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
