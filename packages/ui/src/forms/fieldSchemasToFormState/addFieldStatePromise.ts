import type {
  ClientFieldSchemaMap,
  Data,
  DocumentPreferences,
  Field,
  FieldSchemaMap,
  FormFieldWithoutComponents,
  FormState,
  FormStateWithoutComponents,
  PayloadRequest,
  SanitizedFieldPermissions,
  SanitizedFieldsPermissions,
} from 'payload'

import ObjectIdImport from 'bson-objectid'
import {
  deepCopyObjectSimple,
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsHiddenOrDisabled,
  fieldIsID,
  fieldIsSidebar,
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
  preferences: DocumentPreferences
  previousFormState: FormState
  renderAllFields: boolean
  renderFieldFn: RenderFieldMethod
  /**
   * Req is used for validation and defaultValue calculation. If you don't need validation,
   * just create your own req and pass in the locale and the user
   */
  req: PayloadRequest
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
    fieldIndex,
    fieldSchemaMap,
    filter,
    forceFullValue = false,
    fullData,
    includeSchema = false,
    omitParents = false,
    operation,
    parentIndexPath,
    parentPath,
    parentPermissions,
    parentSchemaPath,
    passesCondition,
    preferences,
    previousFormState,
    renderAllFields,
    renderFieldFn,
    req,
    skipConditionChecks = false,
    skipValidation = false,
    state,
  } = args

  if (!args.clientFieldSchemaMap && args.renderFieldFn) {
    console.warn(
      'clientFieldSchemaMap is not passed to addFieldStatePromise - this will reduce performance',
    )
  }

  const { indexPath, path, schemaPath } = getFieldPaths({
    field,
    index: fieldIndex,
    parentIndexPath: 'name' in field ? '' : parentIndexPath,
    parentPath,
    parentSchemaPath,
  })

  const requiresRender = renderAllFields || previousFormState?.[path]?.requiresRender

  let fieldPermissions: SanitizedFieldPermissions = true

  if (fieldAffectsData(field) && !fieldIsHiddenOrDisabled(field)) {
    fieldPermissions =
      parentPermissions === true
        ? parentPermissions
        : deepCopyObjectSimple(parentPermissions?.[field.name])

    let hasPermission: boolean =
      fieldPermissions === true || deepCopyObjectSimple(fieldPermissions?.read)

    if (typeof field?.access?.read === 'function') {
      hasPermission = await field.access.read({ doc: fullData, req, siblingData: data })
    } else {
      hasPermission = true
    }

    if (!hasPermission) {
      return
    }

    const validate = field.validate

    const fieldState: FormFieldWithoutComponents = {
      errorPaths: [],
      fieldSchema: includeSchema ? field : undefined,
      initialValue: undefined,
      isSidebar: fieldIsSidebar(field),
      passesCondition,
      valid: true,
      value: undefined,
    }

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

      validationResult = await validate(
        data?.[field.name] as never,
        {
          ...field,
          id,
          collectionSlug,
          data: fullData,
          jsonError,
          operation,
          preferences,
          req,
          siblingData: data,
        } as any,
      )
    }

    const addErrorPathToParent = (errorPath: string) => {
      if (typeof addErrorPathToParentArg === 'function') {
        addErrorPathToParentArg(errorPath)
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
    } else {
      fieldState.valid = true
    }

    switch (field.type) {
      case 'array': {
        const arrayValue = Array.isArray(data[field.name]) ? data[field.name] : []

        const { promises, rows } = arrayValue.reduce(
          (acc, row, i: number) => {
            const parentPath = path + '.' + i
            row.id = row?.id || new ObjectId().toHexString()

            if (!omitParents && (!filter || filter(args))) {
              state[parentPath + '.id'] = {
                fieldSchema: includeSchema
                  ? field.fields.find((field) => fieldIsID(field))
                  : undefined,
                initialValue: row.id,
                valid: true,
                value: row.id,
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

            const previousRows = previousFormState?.[path]?.rows || []
            const collapsedRowIDsFromPrefs = preferences?.fields?.[path]?.collapsed

            acc.rows.push({
              id: row.id,
              collapsed: (() => {
                // First, check if `previousFormState` has a matching row
                const previousRow = previousRows.find((prevRow) => prevRow.id === row.id)
                if (previousRow?.collapsed !== undefined) {
                  return previousRow.collapsed
                }

                // If previousFormState is undefined, check preferences
                if (collapsedRowIDsFromPrefs !== undefined) {
                  return collapsedRowIDsFromPrefs.includes(row.id) // Check if collapsed in preferences
                }

                // If neither exists, fallback to `field.admin.initCollapsed`
                return field.admin.initCollapsed
              })(),
            })

            return acc
          },
          {
            promises: [],
            rows: [],
          },
        )

        // Wait for all promises and update fields with the results
        await Promise.all(promises)

        fieldState.rows = rows

        // Unset requiresRender
        // so it will be removed from form state
        fieldState.requiresRender = false

        // Add values to field state
        if (data[field.name] === null) {
          fieldState.value = null
          fieldState.initialValue = null
        } else {
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
            const rowSchemaPath = schemaPath + '.' + block.slug

            if (block) {
              row.id = row?.id || new ObjectId().toHexString()

              if (!omitParents && (!filter || filter(args))) {
                state[parentPath + '.id'] = {
                  fieldSchema: includeSchema
                    ? block.fields.find((blockField) => fieldIsID(blockField))
                    : undefined,
                  initialValue: row.id,
                  valid: true,
                  value: row.id,
                }

                state[parentPath + '.blockType'] = {
                  fieldSchema: includeSchema
                    ? block.fields.find(
                        (blockField) => 'name' in blockField && blockField.name === 'blockType',
                      )
                    : undefined,
                  initialValue: row.blockType,
                  valid: true,
                  value: row.blockType,
                }

                state[parentPath + '.blockName'] = {
                  fieldSchema: includeSchema
                    ? block.fields.find(
                        (blockField) => 'name' in blockField && blockField.name === 'blockName',
                      )
                    : undefined,
                  initialValue: row.blockName,
                  valid: true,
                  value: row.blockName,
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
                  parentSchemaPath: rowSchemaPath,
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

              const collapsedRowIDs = preferences?.fields?.[path]?.collapsed

              acc.rowMetadata.push({
                id: row.id,
                blockType: row.blockType,
                collapsed:
                  collapsedRowIDs === undefined
                    ? field.admin.initCollapsed
                    : collapsedRowIDs.includes(row.id),
              })
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
        fieldState.value = data[field.name]
        fieldState.initialValue = data[field.name]

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
        errorPaths: [],
        initialValue: undefined,
        passesCondition,
        valid: true,
        value: undefined,
      }
    }

    await iterateFields({
      id,
      // passthrough parent functionality
      addErrorPathToParent: addErrorPathToParentArg,
      anyParentLocalized: field.localized || anyParentLocalized,
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
      if (tabHasName(tab)) {
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
        parentIndexPath: tabHasName(tab) ? '' : tabIndexPath,
        parentPassesCondition: passesCondition,
        parentPath: tabHasName(tab) ? tabPath : parentPath,
        parentSchemaPath: tabHasName(tab) ? tabSchemaPath : parentSchemaPath,
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
      state[path] = {
        disableFormData: true,
        errorPaths: [],
        fieldSchema: includeSchema ? field : undefined,
        initialValue: undefined,
        isSidebar: fieldIsSidebar(field),
        passesCondition,
        valid: true,
        value: undefined,
      }
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
