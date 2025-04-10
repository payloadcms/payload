import type {
  BuildFormStateArgs,
  ClientFieldSchemaMap,
  Data,
  DocumentPreferences,
  Field,
  FieldSchemaMap,
  FieldState,
  FlattenedBlock,
  FormState,
  FormStateWithoutComponents,
  PayloadRequest,
  Row,
  SanitizedFieldPermissions,
  SanitizedFieldsPermissions,
  SelectMode,
  SelectType,
  Validate,
} from 'payload'

import ObjectIdImport from 'bson-objectid'
import { getBlockSelect } from 'payload'
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

import { resolveFilterOptions } from '../../utilities/resolveFilterOptions.js'
import { iterateFields } from './iterateFields.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

export type AddFieldStatePromiseArgs = {
  addErrorPathToParent: (fieldPath: string) => void
  /**
   * if all parents are localized, then the field is localized
   */
  anyParentLocalized?: boolean
  /**
   * Data of the nearest parent block, or undefined
   */
  blockData: Data | undefined
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
  mockRSCs?: BuildFormStateArgs['mockRSCs']
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
    blockData,
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
    mockRSCs,
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
    select,
    selectMode,
    skipConditionChecks = false,
    skipValidation = false,
    state,
  } = args

  if (!args.clientFieldSchemaMap && args.renderFieldFn) {
    console.warn(
      'clientFieldSchemaMap is not passed to addFieldStatePromise - this will reduce performance',
    )
  }

  let fieldPermissions: SanitizedFieldPermissions = true

  const fieldState: FieldState = {}

  const lastRenderedPath = previousFormState?.[path]?.lastRenderedPath

  // Append only if true to avoid sending '$undefined' through the network
  if (lastRenderedPath) {
    fieldState.lastRenderedPath = lastRenderedPath
  }

  // If we're rendering all fields, no need to flag this as added by server
  const addedByServer = !renderAllFields && !previousFormState?.[path]

  // Append only if true to avoid sending '$undefined' through the network
  if (addedByServer) {
    fieldState.addedByServer = true
  }

  // Append only if true to avoid sending '$undefined' through the network
  if (passesCondition === false) {
    fieldState.passesCondition = false
  }

  // Append only if true to avoid sending '$undefined' through the network
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
      hasPermission = await field.access.read({
        id,
        blockData,
        data: fullData,
        req,
        siblingData: data,
      })
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
          blockData,
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

        const arraySelect = select?.[field.name]

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
                blockData,
                clientFieldSchemaMap,
                collectionSlug,
                data: row,
                fields: field.fields,
                fieldSchemaMap,
                filter,
                forceFullValue,
                fullData,
                includeSchema,
                mockRSCs,
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
                renderAllFields,
                renderFieldFn,
                req,
                select: typeof arraySelect === 'object' ? arraySelect : undefined,
                selectMode,
                skipConditionChecks,
                skipValidation,
                state,
              }),
            )

            if (!acc.rows) {
              acc.rows = []
            }

            const previousRows = previousFormState?.[path]?.rows || []

            // First, check if `previousFormState` has a matching row
            const previousRow: Row = previousRows.find((prevRow) => prevRow.id === row.id)

            const newRow: Row = {
              id: row.id,
              isLoading: false,
            }

            if (previousRow?.lastRenderedPath) {
              newRow.lastRenderedPath = previousRow.lastRenderedPath
            }

            acc.rows.push(newRow)

            const collapsedRowIDsFromPrefs = preferences?.fields?.[path]?.collapsed

            const collapsed = (() => {
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
            const blockTypeToMatch: string = row.blockType

            const block =
              req.payload.blocks[blockTypeToMatch] ??
              ((field.blockReferences ?? field.blocks).find(
                (blockType) => typeof blockType !== 'string' && blockType.slug === blockTypeToMatch,
              ) as FlattenedBlock | undefined)

            if (!block) {
              throw new Error(
                `Block with type "${row.blockType}" was found in block data, but no block with that type is defined in the config for field with schema path ${schemaPath}.`,
              )
            }

            const { blockSelect, blockSelectMode } = getBlockSelect({
              block,
              select: select?.[field.name],
              selectMode,
            })

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
                  blockData: row,
                  clientFieldSchemaMap,
                  collectionSlug,
                  data: row,
                  fields: block.fields,
                  fieldSchemaMap,
                  filter,
                  forceFullValue,
                  fullData,
                  includeSchema,
                  mockRSCs,
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
                  renderAllFields,
                  renderFieldFn,
                  req,
                  select: typeof blockSelect === 'object' ? blockSelect : undefined,
                  selectMode: blockSelectMode,
                  skipConditionChecks,
                  skipValidation,
                  state,
                }),
              )

              const previousRows = previousFormState?.[path]?.rows || []

              // First, check if `previousFormState` has a matching row
              const previousRow: Row = previousRows.find((prevRow) => prevRow.id === row.id)

              const newRow: Row = {
                id: row.id,
                blockType: row.blockType,
                isLoading: false,
              }

              if (previousRow?.lastRenderedPath) {
                newRow.lastRenderedPath = previousRow.lastRenderedPath
              }

              acc.rowMetadata.push(newRow)

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

        const groupSelect = select?.[field.name]

        await iterateFields({
          id,
          addErrorPathToParent,
          anyParentLocalized: field.localized || anyParentLocalized,
          blockData,
          clientFieldSchemaMap,
          collectionSlug,
          data: data?.[field.name] || {},
          fields: field.fields,
          fieldSchemaMap,
          filter,
          forceFullValue,
          fullData,
          includeSchema,
          mockRSCs,
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
          select: typeof groupSelect === 'object' ? groupSelect : undefined,
          selectMode,
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
            const query = await resolveFilterOptions(field.filterOptions, {
              id,
              blockData,
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
    // Handle field types that do not use names (row, collapsible, etc)

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
      mockRSCs,
      select,
      selectMode,
      // passthrough parent functionality
      addErrorPathToParent: addErrorPathToParentArg,
      anyParentLocalized: fieldIsLocalized(field) || anyParentLocalized,
      blockData,
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
      let tabSelect: SelectType | undefined

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

        if (typeof select?.[tab.name] === 'object') {
          tabSelect = select?.[tab.name] as SelectType
        }
      } else {
        childPermissions = parentPermissions
        tabSelect = select
      }

      const pathSegments = path ? path.split('.') : []

      // If passesCondition is false then this should always result to false
      // If the tab has no admin.condition provided then fallback to passesCondition and let that decide the result
      let tabPassesCondition = passesCondition

      if (passesCondition && typeof tab.admin?.condition === 'function') {
        tabPassesCondition = tab.admin.condition(fullData, data, {
          blockData,
          path: pathSegments,
          user: req.user,
        })
      }

      if (tab?.id) {
        state[tab.id] = {
          passesCondition: tabPassesCondition,
        }
      }

      return iterateFields({
        id,
        addErrorPathToParent: addErrorPathToParentArg,
        anyParentLocalized: tab.localized || anyParentLocalized,
        blockData,
        clientFieldSchemaMap,
        collectionSlug,
        data: isNamedTab ? data?.[tab.name] || {} : data,
        fields: tab.fields,
        fieldSchemaMap,
        filter,
        forceFullValue,
        fullData,
        includeSchema,
        mockRSCs,
        omitParents,
        operation,
        parentIndexPath: isNamedTab ? '' : tabIndexPath,
        parentPassesCondition: tabPassesCondition,
        parentPath: isNamedTab ? tabPath : parentPath,
        parentSchemaPath: isNamedTab ? tabSchemaPath : parentSchemaPath,
        permissions: childPermissions,
        preferences,
        previousFormState,
        renderAllFields,
        renderFieldFn,
        req,
        select: tabSelect,
        selectMode,
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

  if (renderFieldFn && !fieldIsHiddenOrDisabled(field)) {
    const fieldConfig = fieldSchemaMap.get(schemaPath)

    if (!fieldConfig && !mockRSCs) {
      if (schemaPath.endsWith('.blockType')) {
        return
      } else {
        throw new Error(`Field config not found for ${schemaPath}`)
      }
    }

    if (!state[path]) {
      // Some fields (ie `Tab`) do not live in form state
      // therefore we cannot attach customComponents to them
      return
    }

    if (addedByServer) {
      state[path].addedByServer = addedByServer
    }

    renderFieldFn({
      id,
      clientFieldSchemaMap,
      collectionSlug,
      data: fullData,
      fieldConfig: fieldConfig as Field,
      fieldSchemaMap,
      fieldState: state[path],
      formState: state,
      indexPath,
      lastRenderedPath,
      mockRSCs,
      operation,
      parentPath,
      parentSchemaPath,
      path,
      permissions: fieldPermissions,
      preferences,
      previousFieldState: previousFormState?.[path],
      renderAllFields,
      req,
      schemaPath,
      siblingData: data,
    })
  }
}
