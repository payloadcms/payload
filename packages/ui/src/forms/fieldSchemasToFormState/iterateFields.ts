import type {
  BuildFormStateArgs,
  ClientFieldSchemaMap,
  Data,
  DocumentPreferences,
  Field,
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

type ResolvedCondition = (
  data: Data,
  siblingData: Data,
  ctx: { blockData?: Data; operation?: string; path: string[]; user: unknown },
) => boolean

/**
 * Resolves a path-valued admin.condition (string or `{ path, exportName }`)
 * against the runtime import map. Returns `null` if the entry is missing or
 * the export isn't a function — caller falls back to "passes" so a missing
 * import map entry doesn't accidentally hide every field.
 */
function resolvePathValuedCondition(
  ref: { exportName?: string; path: string } | string,
  importMap: PayloadRequest['payload']['importMap'],
): null | ResolvedCondition {
  if (!importMap) {
    return null
  }
  let path: string
  let exportName: string
  if (typeof ref === 'string') {
    if (ref.includes('#')) {
      const [p, e] = ref.split('#', 2) as [string, string]
      path = p
      exportName = e
    } else {
      path = ref
      exportName = 'default'
    }
  } else {
    path = ref.path
    exportName = ref.exportName ?? 'default'
  }
  const entry = (importMap as Record<string, unknown>)[`${path}#${exportName}`]
  if (typeof entry === 'function') {
    return entry as ResolvedCondition
  }
  return null
}

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
  fields: (Field | TabAsField)[]
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
        let conditionResult = true
        const adminCondition = field?.admin?.condition
        if (typeof adminCondition === 'function') {
          conditionResult = Boolean(
            adminCondition(fullData || {}, data || {}, {
              blockData,
              operation,
              path: pathSegments,
              user: req.user,
            }),
          )
        } else if (adminCondition) {
          // Phase 14: path-valued admin.condition. Resolve the function from
          // the import map and evaluate server-side too — without this, the
          // initial form-state build pre-renders custom Field components for
          // fields that should be hidden, baking a stale React element into
          // `customComponents.Field`. When the user later flips the
          // condition true, WatchCondition would unhide that stale element
          // and decideCall would skip targeting the path (already-realized),
          // so the server component never gets a fresh render.
          const resolved = resolvePathValuedCondition(adminCondition, req.payload.importMap)
          if (resolved) {
            conditionResult = Boolean(
              resolved(fullData || {}, data || {}, {
                blockData,
                operation,
                path: pathSegments,
                user: req.user,
              }),
            )
          }
        }
        passesCondition = Boolean(conditionResult && parentPassesCondition)
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
