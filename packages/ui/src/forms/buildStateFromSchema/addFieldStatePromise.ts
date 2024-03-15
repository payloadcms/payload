/* eslint-disable no-param-reassign */
import type {
  Data,
  FormField,
  FormState,
  NonPresentationalField,
  PayloadRequest,
} from 'payload/types'

import ObjectIdImport from 'bson-objectid'
import { fieldAffectsData, fieldHasSubFields, tabHasName } from 'payload/types'
import { getDefaultValue } from 'payload/utilities'

import { getFilterOptionsQuery } from './getFilterOptionsQuery.js'
import { iterateFields } from './iterateFields.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

export type AddFieldStatePromiseArgs = {
  /**
   * if all parents are localized, then the field is localized
   */
  anyParentLocalized?: boolean
  data: Data
  errorPaths: Set<string>
  field: NonPresentationalField
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
  passesCondition: boolean
  path: string
  preferences: {
    [key: string]: unknown
  }
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
  state: FormState
}

/**
 * Flattens the fields schema and fields data.
 * The output is the field path (e.g. array.0.name) mapped to a FormField object.
 */
export const addFieldStatePromise = async (args: AddFieldStatePromiseArgs): Promise<void> => {
  const {
    id,
    anyParentLocalized = false,
    data,
    errorPaths: parentErrorPaths,
    field,
    filter,
    forceFullValue = false,
    fullData,
    includeSchema = false,
    omitParents = false,
    operation,
    passesCondition,
    path,
    preferences,
    req,
    skipConditionChecks = false,
    skipValidation = false,
    state,
  } = args

  if (fieldAffectsData(field)) {
    const validate = operation === 'update' || operation === 'create' ? field.validate : undefined
    const fieldState: FormField = {
      errorPaths: new Set(),
      fieldSchema: includeSchema ? field : undefined,
      initialValue: undefined,
      passesCondition,
      valid: true,
      value: undefined,
    }

    const valueWithDefault = await getDefaultValue({
      defaultValue: field.defaultValue,
      locale: req.locale,
      user: req.user,
      value: data?.[field.name],
    })

    if (data?.[field.name]) {
      data[field.name] = valueWithDefault
    }

    let validationResult: string | true = true

    if (typeof validate === 'function' && !skipValidation) {
      let jsonError

      if (field.type === 'json' && typeof data[field.name] === 'string') {
        try {
          JSON.parse(data[field.name] as string)
        } catch (e) {
          jsonError = e
        }
      }

      validationResult = await validate(data?.[field.name], {
        ...field,
        id,
        data: fullData,
        operation,
        req,
        siblingData: data,
        // @ts-expect-error-next-line
        jsonError,
      })
    }

    if (typeof validationResult === 'string') {
      fieldState.errorMessage = validationResult
      fieldState.valid = false
      // TODO: this is unpredictable, need to figure out why
      // It will sometimes lead to inconsistencies across re-renders
      parentErrorPaths.add(`${path}${field.name}`)
    } else {
      fieldState.valid = true
    }

    switch (field.type) {
      case 'array': {
        const arrayValue = Array.isArray(valueWithDefault) ? valueWithDefault : []

        const { promises, rowMetadata } = arrayValue.reduce(
          (acc, row, i) => {
            const rowPath = `${path}${field.name}.${i}.`
            row.id = row?.id || new ObjectId().toHexString()

            if (!omitParents && (!filter || filter(args))) {
              state[`${rowPath}id`] = {
                fieldSchema: includeSchema
                  ? field.fields.find((field) => 'name' in field && field.name === 'id')
                  : undefined,
                initialValue: row.id,
                valid: true,
                value: row.id,
              }
            }

            acc.promises.push(
              iterateFields({
                id,
                anyParentLocalized: field.localized || anyParentLocalized,
                data: row,
                errorPaths: fieldState.errorPaths,
                fields: field.fields,
                filter,
                forceFullValue,
                fullData,
                includeSchema,
                omitParents,
                operation,
                parentPassesCondition: passesCondition,
                path: rowPath,
                preferences,
                req,
                skipConditionChecks,
                skipValidation,
                state,
              }),
            )

            const collapsedRowIDs = preferences?.fields?.[`${path}${field.name}`]?.collapsed

            acc.rowMetadata.push({
              id: row.id,
              collapsed:
                collapsedRowIDs === undefined
                  ? field.admin.initCollapsed
                  : collapsedRowIDs.includes(row.id),
              errorPaths: fieldState.errorPaths,
            })

            return acc
          },
          {
            promises: [],
            rowMetadata: [],
          },
        )

        await Promise.all(promises)

        // Add values to field state
        if (valueWithDefault === null) {
          fieldState.value = null
          fieldState.initialValue = null
        } else {
          fieldState.value = forceFullValue ? arrayValue : arrayValue.length
          fieldState.initialValue = forceFullValue ? arrayValue : arrayValue.length

          if (arrayValue.length > 0) {
            fieldState.disableFormData = true
          }
        }

        fieldState.rows = rowMetadata

        // Add field to state
        if (!omitParents && (!filter || filter(args))) {
          state[`${path}${field.name}`] = fieldState
        }

        break
      }

      case 'blocks': {
        const blocksValue = Array.isArray(valueWithDefault) ? valueWithDefault : []

        const { promises, rowMetadata } = blocksValue.reduce(
          (acc, row, i) => {
            const block = field.blocks.find((blockType) => blockType.slug === row.blockType)
            const rowPath = `${path}${field.name}.${i}.`

            if (block) {
              row.id = row?.id || new ObjectId().toHexString()

              if (!omitParents && (!filter || filter(args))) {
                state[`${rowPath}id`] = {
                  fieldSchema: includeSchema
                    ? block.fields.find(
                        (blockField) => 'name' in blockField && blockField.name === 'id',
                      )
                    : undefined,
                  initialValue: row.id,
                  valid: true,
                  value: row.id,
                }

                state[`${rowPath}blockType`] = {
                  fieldSchema: includeSchema
                    ? block.fields.find(
                        (blockField) => 'name' in blockField && blockField.name === 'blockType',
                      )
                    : undefined,
                  initialValue: row.blockType,
                  valid: true,
                  value: row.blockType,
                }

                state[`${rowPath}blockName`] = {
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
                  anyParentLocalized: field.localized || anyParentLocalized,
                  data: row,
                  errorPaths: fieldState.errorPaths,
                  fields: block.fields,
                  filter,
                  forceFullValue,
                  fullData,
                  includeSchema,
                  omitParents,
                  operation,
                  parentPassesCondition: passesCondition,
                  path: rowPath,
                  preferences,
                  req,
                  skipConditionChecks,
                  skipValidation,
                  state,
                }),
              )

              const collapsedRowIDs = preferences?.fields?.[`${path}${field.name}`]?.collapsed

              acc.rowMetadata.push({
                id: row.id,
                blockType: row.blockType,
                collapsed:
                  collapsedRowIDs === undefined
                    ? field.admin.initCollapsed
                    : collapsedRowIDs.includes(row.id),
                errorPaths: fieldState.errorPaths,
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
        if (valueWithDefault === null) {
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
          state[`${path}${field.name}`] = fieldState
        }

        break
      }

      case 'group': {
        await iterateFields({
          id,
          anyParentLocalized: field.localized || anyParentLocalized,
          data: data?.[field.name] || {},
          errorPaths: parentErrorPaths,
          fields: field.fields,
          filter,
          forceFullValue,
          fullData,
          includeSchema,
          omitParents,
          operation,
          parentPassesCondition: passesCondition,
          path: `${path}${field.name}.`,
          preferences,
          req,
          skipConditionChecks,
          skipValidation,
          state,
        })

        break
      }

      case 'relationship': {
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

        if (field.hasMany) {
          const relationshipValue = Array.isArray(valueWithDefault)
            ? valueWithDefault.map((relationship) => {
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
            valueWithDefault &&
            typeof valueWithDefault === 'object' &&
            'relationTo' in valueWithDefault &&
            'value' in valueWithDefault
          ) {
            const value =
              typeof valueWithDefault?.value === 'object' &&
              valueWithDefault?.value &&
              'id' in valueWithDefault.value
                ? valueWithDefault.value.id
                : valueWithDefault.value
            const relationshipValue = {
              relationTo: valueWithDefault?.relationTo,
              value,
            }
            fieldState.value = relationshipValue
            fieldState.initialValue = relationshipValue
          }
        } else {
          const relationshipValue =
            valueWithDefault && typeof valueWithDefault === 'object' && 'id' in valueWithDefault
              ? valueWithDefault.id
              : valueWithDefault
          fieldState.value = relationshipValue
          fieldState.initialValue = relationshipValue
        }

        if (!filter || filter(args)) {
          state[`${path}${field.name}`] = fieldState
        }

        break
      }

      case 'upload': {
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

        const relationshipValue =
          valueWithDefault && typeof valueWithDefault === 'object' && 'id' in valueWithDefault
            ? valueWithDefault.id
            : valueWithDefault
        fieldState.value = relationshipValue
        fieldState.initialValue = relationshipValue

        if (!filter || filter(args)) {
          state[`${path}${field.name}`] = fieldState
        }

        break
      }

      default: {
        fieldState.value = valueWithDefault
        fieldState.initialValue = valueWithDefault

        // Add field to state
        if (!filter || filter(args)) {
          state[`${path}${field.name}`] = fieldState
        }

        break
      }
    }
  } else if (fieldHasSubFields(field)) {
    // Handle field types that do not use names (row, etc)
    await iterateFields({
      id,
      anyParentLocalized: field.localized || anyParentLocalized,
      data,
      errorPaths: parentErrorPaths,
      fields: field.fields,
      filter,
      forceFullValue,
      fullData,
      includeSchema,
      omitParents,
      operation,
      parentPassesCondition: passesCondition,
      path,
      preferences,
      req,
      skipConditionChecks,
      skipValidation,
      state,
    })
  } else if (field.type === 'tabs') {
    const promises = field.tabs.map((tab) =>
      iterateFields({
        id,
        anyParentLocalized: tab.localized || anyParentLocalized,
        data: tabHasName(tab) ? data?.[tab.name] : data,
        errorPaths: parentErrorPaths,
        fields: tab.fields,
        filter,
        forceFullValue,
        fullData,
        includeSchema,
        omitParents,
        operation,
        parentPassesCondition: passesCondition,
        path: tabHasName(tab) ? `${path}${tab.name}.` : path,
        preferences,
        req,
        skipConditionChecks,
        skipValidation,
        state,
      }),
    )

    await Promise.all(promises)
  }
}
