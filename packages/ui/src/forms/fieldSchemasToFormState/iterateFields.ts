import type {
  BuildFormStateArgs,
  ClientFieldSchemaMap,
  Data,
  DocumentPreferences,
  Field,
  FieldOperation,
  FieldSchemaMap,
  FormState,
  FormStateWithoutComponents,
  PayloadRequest,
  SanitizedFieldsPermissions,
  SelectMode,
  SelectType,
  TabAsField,
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
  /**
   * With `select`, a copy of `data` taken before unselected fields are stripped from it.
   * Field conditions read it, so they still see fields outside `select`.
   */
  conditionData?: Data
  data: Data
  fields: (Field | TabAsField)[]
  fieldSchemaMap: FieldSchemaMap
  filter?: (args: AddFieldStatePromiseArgs) => boolean
  /**
   * Force the value of fields like arrays or blocks to be the full value instead of the length @default false
   */
  forceFullValue?: boolean
  fullData: Data
  globalSlug?: string
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
  operation: FieldOperation
  parentIndexPath: string
  parentPassesCondition?: boolean
  parentPath: string
  parentSchemaPath: string
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
 * Finds the object holding the field at `path` (its siblings) in `data`.
 * Unnamed fields (rows, collapsibles, unnamed tabs) add `_index-` segments that hold no data.
 */
export const getUnstrippedSiblingData = (data: Data, path: string): Data | undefined => {
  let siblingData: Data | undefined = data

  for (const segment of path.split('.').slice(0, -1)) {
    if (!segment.startsWith('_index-')) {
      siblingData = siblingData?.[segment]
    }
  }

  return siblingData
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
  conditionData,
  data,
  fields,
  fieldSchemaMap,
  filter,
  forceFullValue = false,
  fullData,
  globalSlug,
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
    let passesCondition = true

    const { indexPath, path, schemaPath } = getFieldPaths({
      field,
      index: fieldIndex,
      parentIndexPath,
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
                field.admin.condition(
                  fullData || {},
                  (conditionData ? getUnstrippedSiblingData(conditionData, path) : data) || {},
                  {
                    blockData,
                    operation,
                    path: pathSegments,
                    user: req.user,
                  },
                ),
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
        conditionData,
        data,
        field,
        fieldIndex,
        fieldSchemaMap,
        filter,
        forceFullValue,
        fullData,
        globalSlug,
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
        readOnly,
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
