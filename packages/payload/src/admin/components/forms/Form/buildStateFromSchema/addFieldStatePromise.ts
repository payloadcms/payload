/* eslint-disable no-param-reassign */
import type { TFunction } from 'i18next'

import ObjectID from 'bson-objectid'

import type { User } from '../../../../../auth'
import type { SanitizedConfig } from '../../../../../config/types'
import type { NonPresentationalField } from '../../../../../fields/config/types'
import type { Data, Fields, FormField } from '../types'

import { fieldAffectsData, fieldHasSubFields, tabHasName } from '../../../../../fields/config/types'
import getValueWithDefault from '../../../../../fields/getDefaultValue'
import { iterateFields } from './iterateFields'

export type AddFieldStatePromiseArgs = {
  /**
   * if all parents are localized, then the field is localized
   */
  anyParentLocalized?: boolean
  config: SanitizedConfig
  data: Data
  field: NonPresentationalField
  /**
   * You can use this to filter down to only `localized` fields that require transalation (type: text, textarea, etc.). Another plugin might want to look for only `point` type fields to do some GIS function. With the filter function you can go in like a surgeon.
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
  locale: string
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
   * Whether to skip checking the field's condition. @default false
   */
  skipConditionChecks?: boolean
  /**
   * Whether to skip validating the field. @default false
   */
  skipValidation?: boolean
  state: Fields
  t: TFunction
  user: User
}

/**
 * Flattens the fields schema and fields data.
 * The output is the field path (e.g. array.0.name) mapped to a FormField object.
 */
export const addFieldStatePromise = async (args: AddFieldStatePromiseArgs): Promise<void> => {
  const {
    id,
    anyParentLocalized = false,
    config,
    data,
    field,
    filter,
    forceFullValue = false,
    fullData,
    includeSchema = false,
    locale,
    omitParents = false,
    operation,
    passesCondition,
    path,
    preferences,
    skipConditionChecks = false,
    skipValidation = false,
    state,
    t,
    user,
  } = args
  if (fieldAffectsData(field)) {
    const fieldState: FormField = {
      condition: field.admin?.condition,
      fieldSchema: includeSchema ? field : undefined,
      initialValue: undefined,
      passesCondition,
      valid: true,
      validate: field.validate,
      value: undefined,
    }

    const valueWithDefault = await getValueWithDefault({
      defaultValue: field.defaultValue,
      locale,
      user,
      value: data?.[field.name],
    })

    if (data?.[field.name]) {
      data[field.name] = valueWithDefault
    }

    let validationResult: string | true = true

    if (typeof fieldState.validate === 'function' && !skipValidation) {
      validationResult = await fieldState.validate(data?.[field.name], {
        ...field,
        id,
        config,
        data: fullData,
        operation,
        previousValue: data?.[field.name],
        siblingData: data,
        t,
        user,
      })
    }

    if (typeof validationResult === 'string') {
      fieldState.errorMessage = validationResult
      fieldState.valid = false
    } else {
      fieldState.valid = true
    }

    switch (field.type) {
      case 'array': {
        const arrayValue = Array.isArray(valueWithDefault) ? valueWithDefault : []
        const { promises, rowMetadata } = arrayValue.reduce(
          (acc, row, i) => {
            const rowPath = `${path}${field.name}.${i}.`
            row.id = row?.id || new ObjectID().toHexString()

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
                config,
                data: row,
                fields: field.fields,
                filter,
                forceFullValue,
                fullData,
                includeSchema,
                locale,
                omitParents,
                operation,
                parentPassesCondition: passesCondition,
                path: rowPath,
                preferences,
                skipConditionChecks,
                skipValidation,
                state,
                t,
                user,
              }),
            )

            const collapsedRowIDs = preferences?.fields?.[`${path}${field.name}`]?.collapsed

            acc.rowMetadata.push({
              id: row.id,
              childErrorPaths: new Set(),
              collapsed:
                collapsedRowIDs === undefined
                  ? field.admin.initCollapsed
                  : collapsedRowIDs.includes(row.id),
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
          fieldState.previousValue = fieldState.value
          fieldState.initialValue = null
        } else {
          fieldState.value = forceFullValue ? arrayValue : arrayValue.length
          fieldState.previousValue = fieldState.value
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
              row.id = row?.id || new ObjectID().toHexString()

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
                  config,
                  data: row,
                  fields: block.fields,
                  filter,
                  forceFullValue,
                  fullData,
                  includeSchema,
                  locale,
                  omitParents,
                  operation,
                  parentPassesCondition: passesCondition,
                  path: rowPath,
                  preferences,
                  skipConditionChecks,
                  skipValidation,
                  state,
                  t,
                  user,
                }),
              )

              const collapsedRowIDs = preferences?.fields?.[`${path}${field.name}`]?.collapsed

              acc.rowMetadata.push({
                id: row.id,
                blockType: row.blockType,
                childErrorPaths: new Set(),
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
        if (valueWithDefault === null) {
          fieldState.value = null
          fieldState.previousValue = fieldState.value
          fieldState.initialValue = null
        } else {
          fieldState.value = forceFullValue ? blocksValue : blocksValue.length
          fieldState.previousValue = fieldState.value
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
          config,
          data: data?.[field.name] || {},
          fields: field.fields,
          filter,
          forceFullValue,
          fullData,
          includeSchema,
          locale,
          omitParents,
          operation,
          parentPassesCondition: passesCondition,
          path: `${path}${field.name}.`,
          preferences,
          skipConditionChecks,
          skipValidation,
          state,
          t,
          user,
        })

        break
      }

      case 'relationship': {
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
          fieldState.previousValue = fieldState.value
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
            fieldState.previousValue = fieldState.value
            fieldState.initialValue = relationshipValue
          }
        } else {
          const relationshipValue =
            valueWithDefault && typeof valueWithDefault === 'object' && 'id' in valueWithDefault
              ? valueWithDefault.id
              : valueWithDefault
          fieldState.value = relationshipValue
          fieldState.previousValue = fieldState.value
          fieldState.initialValue = relationshipValue
        }

        if (!filter || filter(args)) {
          state[`${path}${field.name}`] = fieldState
        }

        break
      }

      case 'upload': {
        const relationshipValue =
          valueWithDefault && typeof valueWithDefault === 'object' && 'id' in valueWithDefault
            ? valueWithDefault.id
            : valueWithDefault
        fieldState.value = relationshipValue
        fieldState.previousValue = fieldState.value
        fieldState.initialValue = relationshipValue

        if (!filter || filter(args)) {
          state[`${path}${field.name}`] = fieldState
        }

        break
      }

      default: {
        fieldState.value = valueWithDefault
        fieldState.previousValue = fieldState.value
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
      config,
      data,
      fields: field.fields,
      filter,
      forceFullValue,
      fullData,
      includeSchema,
      locale,
      omitParents,
      operation,
      parentPassesCondition: passesCondition,
      path,
      preferences,
      skipConditionChecks,
      skipValidation,
      state,
      t,
      user,
    })
  } else if (field.type === 'tabs') {
    const promises = field.tabs.map((tab) =>
      iterateFields({
        id,
        anyParentLocalized: tab.localized || anyParentLocalized,
        config,
        data: tabHasName(tab) ? data?.[tab.name] : data,
        fields: tab.fields,
        filter,
        forceFullValue,
        fullData,
        includeSchema,
        locale,
        omitParents,
        operation,
        parentPassesCondition: passesCondition,
        path: tabHasName(tab) ? `${path}${tab.name}.` : path,
        preferences,
        skipConditionChecks,
        skipValidation,
        state,
        t,
        user,
      }),
    )

    await Promise.all(promises)
  }
}
