import type {
  ClientFieldSchemaMap,
  Data,
  DocumentPreferences,
  Field,
  FieldSchemaMap,
  FieldState,
  FormState,
  FormStateWithoutComponents,
  PayloadRequest,
  SanitizedFieldPermissions,
  SanitizedFieldsPermissions,
  Validate,
} from 'payload'

import ObjectIdImport from 'bson-objectid'
import {
  deepCopyObjectSimple,
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsHiddenOrDisabled,
  fieldIsID,
  fieldIsLocalized,
  getFieldPaths,
  tabHasName,
} from 'payload/shared'

import type { RenderFieldMethod } from './types.js'

import { getFilterOptionsQuery } from './getFilterOptionsQuery.js'
import { iterateFields } from './iterateFields.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

export type AddFieldStatePromiseArgs = {
  addErrorPathToParent: (fieldPath: string) => void
  /**
   * if all parents are localized, then the field is localized
   */
  anyParentLocalized?: boolean
  clientFieldSchemaMap?: ClientFieldSchemaMap
  collectionSlug?: string
  data: Data
  field: Field
  fieldIndex: number
  fieldSchemaMap: FieldSchemaMap
  /**
   * You can use this to filter down to only `localized` fields that require translation (type: text, textarea, etc.). Another plugin might want to look for only `point` type fields to do some GIS function. With the filter function you can go in like a surgeon.
   */
  filter?: (args: AddFieldStatePromiseArgs) => boolean
  /**
   * Force the value of fields like arrays or blocks to be the full value instead of the length @default false
   */
  forceFullValue?: boolean
  fullData: Data
  id: number | string
  /**
   * Whether the field schema should be included in the state
   */
  includeSchema?: boolean
  indexPath: string
  /**
   * Whether to omit parent fields in the state. @default false
   */
  omitParents?: boolean
  operation: 'create' | 'update'
  parentIndexPath: string
  parentPath: string
  parentPermissions: SanitizedFieldsPermissions
  parentSchemaPath: string
  passesCondition: boolean
  path: string
  preferences: DocumentPreferences
  previousFormState: FormState
  renderAllFields: boolean
  renderFieldFn: RenderFieldMethod
  /**
   * Req is used for validation and defaultValue calculation. If you don't need validation,
   * just create your own req and pass in the locale and the user
   */
  req: PayloadRequest
  schemaPath: string
  /**
   * Whether to skip checking the field's condition. @default false
   */
  skipConditionChecks?: boolean
  /**
   * Whether to skip validating the field. @default false
   */
  skipValidation?: boolean
  state: FormStateWithoutComponents
}

/**
 * Flattens the fields schema and fields data.
 * The output is the field path (e.g. array.0.name) mapped to a FormField object.
 */
export const addFieldStatePromise = async (args: AddFieldStatePromiseArgs): Promise<void> => {
  const {
    id,
    addErrorPathToParent: addErrorPathToParentArg,
    anyParentLocalized = false,
    clientFieldSchemaMap,
    collectionSlug,
    data,
    field,
    fieldSchemaMap,
    filter,
    forceFullValue = false,
    fullData,
    includeSchema = false,
    indexPath,
    omitParents = false,
    operation,
    parentPath,
    parentPermissions,
    parentSchemaPath,
    passesCondition,
    path,
    preferences,
    previousFormState,
    renderAllFields,
    renderFieldFn,
    req,
    schemaPath,
    skipConditionChecks = false,
    skipValidation = false,
    state,
  } = args

  if (!args.clientFieldSchemaMap && args.renderFieldFn) {
    console.warn(
      'clientFieldSchemaMap is not passed to addFieldStatePromise - this will reduce performance',
    )
  }

  const requiresRender = renderAllFields || previousFormState?.[path]?.requiresRender

  let fieldPermissions: SanitizedFieldPermissions = true

  const fieldState: FieldState = {}

  if (passesCondition === false) {
    fieldState.passesCondition = false
  }

  if (includeSchema) {
    fieldState.fieldSchema = field
  }

  if (fieldAffectsData(field) && !fieldIsHiddenOrDisabled(field)) {
    fieldPermissions =
      parentPermissions === true
        ? parentPermissions
        : deepCopyObjectSimple(parentPermissions?.[field.name])

    let hasPermission: boolean =
      fieldPermissions === true || deepCopyObjectSimple(fieldPermissions?.read)

    if (typeof field?.access?.read === 'function') {
      hasPermission = await field.access.read({ id, data: fullData, req, siblingData: data })
    } else {
      hasPermission = true
    }

    if (!hasPermission) {
      return
    }

    const validate: Validate = field.validate

    let validationResult: string | true = true

    if (typeof validate === 'function' && !skipValidation && passesCondition) {
      let jsonError

      if (field.type === 'json' && typeof data[field.name] === 'string') {
        try {
          JSON.parse(data[field.name])
        } catch (e) {
          jsonError = e
        }
      }

      try {
        validationResult = await validate(data?.[field.name], {
          ...field,
          id,
          collectionSlug,
          data: fullData,
          event: 'onChange',
          // @AlessioGr added `jsonError` in https://github.com/payloadcms/payload/commit/c7ea62a39473408c3ea912c4fbf73e11be4b538d
          // @ts-expect-error-next-line
          jsonError,
          operation,
          preferences,
          previousValue: previousFormState?.[path]?.initialValue,
          req,
          siblingData: data,
        })
      } catch (err) {
        validationResult = `Error validating field at path: ${path}`

        req.payload.logger.error({
          err,
          msg: validationResult,
        })
      }
    }

    const addErrorPathToParent = (errorPath: string) => {
      if (typeof addErrorPathToParentArg === 'function') {
        addErrorPathToParentArg(errorPath)
      }

      if (!fieldState.errorPaths) {
        fieldState.errorPaths = []
      }

      if (!fieldState.errorPaths.includes(errorPath)) {
        fieldState.errorPaths.push(errorPath)
        fieldState.valid = false
      }
    }

    if (typeof validationResult === 'string') {
      fieldState.errorMessage = validationResult
      fieldState.valid = false
      addErrorPathToParent(path)
    }

    switch (field.type) {
      case 'array': {
        const arrayValue = Array.isArray(data[field.name]) ? data[field.name] : []

        const { promises, rows } = arrayValue.reduce(
          (acc, row, i: number) => {
            const parentPath = path + '.' + i
            row.id = row?.id || new ObjectId().toHexString()

            if (!omitParents && (!filter || filter(args))) {
              const idKey = parentPath + '.id'

              state[idKey] = {
                initialValue: row.id,
                value: row.id,
              }

              if (includeSchema) {
                state[idKey].fieldSchema = field.fields.find((field) => fieldIsID(field))
              }
            }

            acc.promises.push(
              iterateFields({
                id,
                addErrorPathToParent,
                anyParentLocalized: field.localized || anyParentLocalized,
                clientFieldSchemaMap,
                collectionSlug,
                data: row,
                fields: field.fields,
                fieldSchemaMap,
                filter,
                forceFullValue,
                fullData,
                includeSchema,
                omitParents,
                operation,
                parentIndexPath: '',
                parentPassesCondition: passesCondition,
                parentPath,
                parentSchemaPath: schemaPath,
                permissions:
                  fieldPermissions === true ? fieldPermissions : fieldPermissions?.fields || {},
                preferences,
                previousFormState,
                renderAllFields: requiresRender,
                renderFieldFn,
                req,
                skipConditionChecks,
                skipValidation,
                state,
              }),
            )

            if (!acc.rows) {
              acc.rows = []
            }

            acc.rows.push({
              id: row.id,
            })

            const previousRows = previousFormState?.[path]?.rows || []
            const collapsedRowIDsFromPrefs = preferences?.fields?.[path]?.collapsed

            const collapsed = (() => {
              // First, check if `previousFormState` has a matching row
              const previousRow = previousRows.find((prevRow) => prevRow.id === row.id)
              if (previousRow) {
                return previousRow.collapsed ?? false
              }

              // If previousFormState is undefined, check preferences
              if (collapsedRowIDsFromPrefs !== undefined) {
                return collapsedRowIDsFromPrefs.includes(row.id) // Check if collapsed in preferences
              }

              // If neither exists, fallback to `field.admin.initCollapsed`
              return field.admin.initCollapsed
            })()

            if (collapsed) {
              acc.rows[acc.rows.length - 1].collapsed = collapsed
            }

            return acc
          },
          {
            promises: [],
            rows: undefined,
          },
        )

        // Wait for all promises and update fields with the results
        await Promise.all(promises)

        if (rows) {
          fieldState.rows = rows
        }

        // Unset requiresRender
        // so it will be removed from form state
        fieldState.requiresRender = false

        // Add values to field state
        if (data[field.name] !== null) {
          fieldState.value = forceFullValue ? arrayValue : arrayValue.length
          fieldState.initialValue = forceFullValue ? arrayValue : arrayValue.length

          if (arrayValue.length > 0) {
            fieldState.disableFormData = true
          }
        }

        // Add field to state
        if (!omitParents && (!filter || filter(args))) {
          state[path] = fieldState
        }

        break
      }

      case 'blocks': {
        const blocksValue = Array.isArray(data[field.name]) ? data[field.name] : []

        const { promises, rowMetadata } = blocksValue.reduce(
          (acc, row, i: number) => {
            const block = field.blocks.find((blockType) => blockType.slug === row.blockType)
            if (!block) {
              throw new Error(
                `Block with type "${row.blockType}" was found in block data, but no block with that type is defined in the config for field with schema path ${schemaPath}.`,
              )
            }

            const parentPath = path + '.' + i

            if (block) {
              row.id = row?.id || new ObjectId().toHexString()

              if (!omitParents && (!filter || filter(args))) {
                // Handle block `id` field
                const idKey = parentPath + '.id'

                state[idKey] = {
                  initialValue: row.id,
                  value: row.id,
                }

                if (includeSchema) {
                  state[idKey].fieldSchema = includeSchema
                    ? block.fields.find((blockField) => fieldIsID(blockField))
                    : undefined
                }

                // Handle `blockType` field
                const fieldKey = parentPath + '.blockType'

                state[fieldKey] = {
                  initialValue: row.blockType,
                  value: row.blockType,
                }

                if (includeSchema) {
                  state[fieldKey].fieldSchema = block.fields.find(
                    (blockField) => 'name' in blockField && blockField.name === 'blockType',
                  )
                }

                // Handle `blockName` field
                const blockNameKey = parentPath + '.blockName'

                state[blockNameKey] = {}

                if (row.blockName) {
                  state[blockNameKey].initialValue = row.blockName
                  state[blockNameKey].value = row.blockName
                }

                if (includeSchema) {
                  state[blockNameKey].fieldSchema = block.fields.find(
                    (blockField) => 'name' in blockField && blockField.name === 'blockName',
                  )
                }
              }

              acc.promises.push(
                iterateFields({
                  id,
                  addErrorPathToParent,
                  anyParentLocalized: field.localized || anyParentLocalized,
                  clientFieldSchemaMap,
                  collectionSlug,
                  data: row,
                  fields: block.fields,
                  fieldSchemaMap,
                  filter,
                  forceFullValue,
                  fullData,
                  includeSchema,
                  omitParents,
                  operation,
                  parentIndexPath: '',
                  parentPassesCondition: passesCondition,
                  parentPath,
                  parentSchemaPath: schemaPath + '.' + block.slug,
                  permissions:
                    fieldPermissions === true
                      ? fieldPermissions
                      : parentPermissions?.[field.name]?.blocks?.[block.slug] === true
                        ? true
                        : parentPermissions?.[field.name]?.blocks?.[block.slug]?.fields || {},
                  preferences,
                  previousFormState,
                  renderAllFields: requiresRender,
                  renderFieldFn,
                  req,
                  skipConditionChecks,
                  skipValidation,
                  state,
                }),
              )

              acc.rowMetadata.push({
                id: row.id,
                blockType: row.blockType,
              })

              const collapsedRowIDs = preferences?.fields?.[path]?.collapsed

              const collapsed =
                collapsedRowIDs === undefined
                  ? field.admin.initCollapsed
                  : collapsedRowIDs.includes(row.id)

              if (collapsed) {
                acc.rowMetadata[acc.rowMetadata.length - 1].collapsed = collapsed
              }
            }

            return acc
          },
          {
            promises: [],
            rowMetadata: [],
          },
        )

        await Promise.all(promises)

        // Add values to field state
        if (data[field.name] === null) {
          fieldState.value = null
          fieldState.initialValue = null
        } else {
          fieldState.value = forceFullValue ? blocksValue : blocksValue.length
          fieldState.initialValue = forceFullValue ? blocksValue : blocksValue.length

          if (blocksValue.length > 0) {
            fieldState.disableFormData = true
          }
        }

        fieldState.rows = rowMetadata

        // Unset requiresRender
        // so it will be removed from form state
        fieldState.requiresRender = false

        // Add field to state
        if (!omitParents && (!filter || filter(args))) {
          state[path] = fieldState
        }

        break
      }

      case 'group': {
        if (!filter || filter(args)) {
          fieldState.disableFormData = true
          state[path] = fieldState
        }

        await iterateFields({
          id,
          addErrorPathToParent,
          anyParentLocalized: field.localized || anyParentLocalized,
          clientFieldSchemaMap,
          collectionSlug,
          data: data?.[field.name] || {},
          fields: field.fields,
          fieldSchemaMap,
          filter,
          forceFullValue,
          fullData,
          includeSchema,
          omitParents,
          operation,
          parentIndexPath: '',
          parentPassesCondition: passesCondition,
          parentPath: path,
          parentSchemaPath: schemaPath,
          permissions:
            typeof fieldPermissions === 'boolean' ? fieldPermissions : fieldPermissions?.fields,
          preferences,
          previousFormState,
          renderAllFields,
          renderFieldFn,
          req,
          skipConditionChecks,
          skipValidation,
          state,
        })

        break
      }
      case 'relationship':
      case 'upload': {
        if (field.filterOptions) {
          if (typeof field.filterOptions === 'object') {
            if (typeof field.relationTo === 'string') {
              fieldState.filterOptions = {
                [field.relationTo]: field.filterOptions,
              }
            } else {
              fieldState.filterOptions = field.relationTo.reduce((acc, relation) => {
                acc[relation] = field.filterOptions
                return acc
              }, {})
            }
          }

          if (typeof field.filterOptions === 'function') {
            const query = await getFilterOptionsQuery(field.filterOptions, {
              id,
              data: fullData,
              relationTo: field.relationTo,
              req,
              siblingData: data,
              user: req.user,
            })

            fieldState.filterOptions = query
          }
        }

        if (field.hasMany) {
          const relationshipValue = Array.isArray(data[field.name])
            ? data[field.name].map((relationship) => {
                if (Array.isArray(field.relationTo)) {
                  return {
                    relationTo: relationship.relationTo,
                    value:
                      relationship.value && typeof relationship.value === 'object'
                        ? relationship.value?.id
                        : relationship.value,
                  }
                }
                if (typeof relationship === 'object' && relationship !== null) {
                  return relationship.id
                }
                return relationship
              })
            : undefined

          fieldState.value = relationshipValue
          fieldState.initialValue = relationshipValue
        } else if (Array.isArray(field.relationTo)) {
          if (
            data[field.name] &&
            typeof data[field.name] === 'object' &&
            'relationTo' in data[field.name] &&
            'value' in data[field.name]
          ) {
            const value =
              typeof data[field.name]?.value === 'object' &&
              data[field.name]?.value &&
              'id' in data[field.name].value
                ? data[field.name].value.id
                : data[field.name].value
            const relationshipValue = {
              relationTo: data[field.name]?.relationTo,
              value,
            }
            fieldState.value = relationshipValue
            fieldState.initialValue = relationshipValue
          }
        } else {
          const relationshipValue =
            data[field.name] && typeof data[field.name] === 'object' && 'id' in data[field.name]
              ? data[field.name].id
              : data[field.name]
          fieldState.value = relationshipValue
          fieldState.initialValue = relationshipValue
        }

        if (!filter || filter(args)) {
          state[path] = fieldState
        }

        break
      }

      default: {
        if (data[field.name] !== undefined) {
          fieldState.value = data[field.name]
          fieldState.initialValue = data[field.name]
        }

        // Add field to state
        if (!filter || filter(args)) {
          state[path] = fieldState
        }

        break
      }
    }
  } else if (fieldHasSubFields(field) && !fieldAffectsData(field)) {
    // Handle field types that do not use names (row, etc)

    if (!filter || filter(args)) {
      state[path] = {
        disableFormData: true,
      }

      if (passesCondition === false) {
        state[path].passesCondition = false
      }
    }

    await iterateFields({
      id,
      // passthrough parent functionality
      addErrorPathToParent: addErrorPathToParentArg,
      anyParentLocalized: fieldIsLocalized(field) || anyParentLocalized,
      clientFieldSchemaMap,
      collectionSlug,
      data,
      fields: field.fields,
      fieldSchemaMap,
      filter,
      forceFullValue,
      fullData,
      includeSchema,
      omitParents,
      operation,
      parentIndexPath: indexPath,
      parentPassesCondition: passesCondition,
      parentPath,
      parentSchemaPath,
      permissions: parentPermissions, // TODO: Verify this is correct
      preferences,
      previousFormState,
      renderAllFields,
      renderFieldFn,
      req,
      skipConditionChecks,
      skipValidation,
      state,
    })
  } else if (field.type === 'tabs') {
    const promises = field.tabs.map((tab, tabIndex) => {
      const isNamedTab = tabHasName(tab)

      const {
        indexPath: tabIndexPath,
        path: tabPath,
        schemaPath: tabSchemaPath,
      } = getFieldPaths({
        field: {
          ...tab,
          type: 'tab',
        },
        index: tabIndex,
        parentIndexPath: indexPath,
        parentPath,
        parentSchemaPath,
      })

      let childPermissions: SanitizedFieldsPermissions = undefined

      if (isNamedTab) {
        if (parentPermissions === true) {
          childPermissions = true
        } else {
          const tabPermissions = parentPermissions?.[tab.name]
          if (tabPermissions === true) {
            childPermissions = true
          } else {
            childPermissions = tabPermissions?.fields
          }
        }
      } else {
        childPermissions = parentPermissions
      }

      return iterateFields({
        id,
        addErrorPathToParent: addErrorPathToParentArg,
        anyParentLocalized: tab.localized || anyParentLocalized,
        clientFieldSchemaMap,
        collectionSlug,
        data: isNamedTab ? data?.[tab.name] || {} : data,
        fields: tab.fields,
        fieldSchemaMap,
        filter,
        forceFullValue,
        fullData,
        includeSchema,
        omitParents,
        operation,
        parentIndexPath: isNamedTab ? '' : tabIndexPath,
        parentPassesCondition: passesCondition,
        parentPath: isNamedTab ? tabPath : parentPath,
        parentSchemaPath: isNamedTab ? tabSchemaPath : parentSchemaPath,
        permissions: childPermissions,
        preferences,
        previousFormState,
        renderAllFields,
        renderFieldFn,
        req,
        skipConditionChecks,
        skipValidation,
        state,
      })
    })

    await Promise.all(promises)
  } else if (field.type === 'ui') {
    if (!filter || filter(args)) {
      state[path] = fieldState
      state[path].disableFormData = true
    }
  }

  if (requiresRender && renderFieldFn && !fieldIsHiddenOrDisabled(field)) {
    const fieldState = state[path]

    const fieldConfig = fieldSchemaMap.get(schemaPath)

    if (!fieldConfig) {
      if (schemaPath.endsWith('.blockType')) {
        return
      } else {
        throw new Error(`Field config not found for ${schemaPath}`)
      }
    }

    if (!fieldState) {
      // Some fields (ie `Tab`) do not live in form state
      // therefore we cannot attach customComponents to them
      return
    }

    renderFieldFn({
      id,
      clientFieldSchemaMap,
      collectionSlug,
      data: fullData,
      fieldConfig: fieldConfig as Field,
      fieldSchemaMap,
      fieldState,
      formState: state,
      indexPath,
      operation,
      parentPath,
      parentSchemaPath,
      path,
      permissions: fieldPermissions,
      preferences,
      previousFieldState: previousFormState?.[path],
      req,
      schemaPath,
      siblingData: data,
    })
  }
}
