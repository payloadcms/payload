/* eslint-disable no-param-reassign */
import type { TFunction } from '@payloadcms/translations'
import type { User } from 'payload/auth'
import type { Data, NonPresentationalField, SanitizedConfig } from 'payload/types'

import ObjectId from 'bson-objectid'
import { fieldAffectsData, fieldHasSubFields, tabHasName } from 'payload/types'
import { getDefaultValue } from 'payload/utilities'

import type { FormField, FormState } from '../../Form/types'

import { iterateFields } from './iterateFields'

type AddFieldStatePromiseArgs = {
  /**
   * if all parents are localized, then the field is localized
   */
  anyParentLocalized?: boolean
  data: Data
  errorPaths: Set<string>
  field: NonPresentationalField
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
  state: FormState
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
    data,
    errorPaths: parentErrorPaths,
  field,
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
    skipValidation = false,state,
  t,
  user,
  } = args
  if (fieldAffectsData(field)) {
    const validate = operation === 'update' ? field.validate : undefined
    const fieldState: FormField = {
      errorPaths: new Set(),
      initialValue: undefined,
      passesCondition,
      valid: true,
      value: undefined,
    }

    const valueWithDefault = await getDefaultValue({
      defaultValue: field.defaultValue,
      locale,
      user,
      value: data?.[field.name],
    })

    if (data?.[field.name]) {
      data[field.name] = valueWithDefault
    }

    let validationResult: string | true = true

    if (typeof validate === 'function' && !skipValidation) {
      validationResult = await validate(data?.[field.name], {
        ...field,
        id,
        data: fullData,
        operation,
        siblingData: data,
        t,
        user,
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

            if (!omitParents) {
              state[`${rowPath}id`] = {
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
        if (!omitParents) {
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

              if (!omitParents) {
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
                  data: row,
                  anyParentLocalized: field.localized || anyParentLocalized,
                  errorPaths: fieldState.errorPaths,
                  fields: block.fields,
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
        if (!omitParents) {
          state[`${path}${field.name}`] = fieldState
        }

        break
      }

      case 'group': {
        await iterateFields({
          id,
          data: data?.[field.name] || {},
          anyParentLocalized: field.localized || anyParentLocalized,
          errorPaths: parentErrorPaths,
          fields: field.fields,
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

        state[`${path}${field.name}`] = fieldState

        break
      }

      case 'upload': {
        const relationshipValue =
          valueWithDefault && typeof valueWithDefault === 'object' && 'id' in valueWithDefault
            ? valueWithDefault.id
            : valueWithDefault
        fieldState.value = relationshipValue
        fieldState.initialValue = relationshipValue

        state[`${path}${field.name}`] = fieldState

        break
      }

      default: {
        fieldState.value = valueWithDefault
        fieldState.initialValue = valueWithDefault

        // Add field to state
        state[`${path}${field.name}`] = fieldState

        break
      }
    }
  } else if (fieldHasSubFields(field)) {
    // Handle field types that do not use names (row, etc)
    await iterateFields({
      id,
      data,
      anyParentLocalized: field.localized || anyParentLocalized,
      errorPaths: parentErrorPaths,
      fields: field.fields,
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
        data: tabHasName(tab) ? data?.[tab.name] : data,
        errorPaths: parentErrorPaths,
        fields: tab.fields,
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
