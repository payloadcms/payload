/* eslint-disable no-param-reassign */
import type { TFunction } from 'i18next'

import ObjectID from 'bson-objectid'

import type { User } from 'payload/auth'
import type { NonPresentationalField, SanitizedCollectionConfig } from 'payload/types'
import type { Data, Fields, FormField } from '../types'

import { fieldAffectsData, fieldHasSubFields, tabHasName } from 'payload/types'
import getValueWithDefault from 'payload/dist/fields/getDefaultValue' // TODO: replace with 'payload/fields/getDefaultValue'
import { iterateFields } from './iterateFields'

type Args = {
  config: SanitizedCollectionConfig
  data: Data
  field: NonPresentationalField
  fullData: Data
  id: number | string
  locale: string
  operation: 'create' | 'update'
  passesCondition: boolean
  path: string
  preferences: {
    [key: string]: unknown
  }
  state: Fields
  t: TFunction
  user: User
}

export const addFieldStatePromise = async ({
  id,
  config,
  data,
  field,
  fullData,
  locale,
  operation,
  passesCondition,
  path,
  preferences,
  state,
  t,
  user,
}: Args): Promise<void> => {
  if (fieldAffectsData(field)) {
    const fieldState: FormField = {
      // condition: field.admin?.condition,
      initialValue: undefined,
      passesCondition,
      valid: true,
      // validate: field.validate,
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

    let validationResult: boolean | string = true

    // if (typeof fieldState.validate === 'function') {
    //   validationResult = await fieldState.validate(data?.[field.name], {
    //     ...field,
    //     id,
    //     config,
    //     data: fullData,
    //     operation,
    //     siblingData: data,
    //     t,
    //     user,
    //   })
    // }

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

            state[`${rowPath}id`] = {
              initialValue: row.id,
              valid: true,
              value: row.id,
            }

            acc.promises.push(
              iterateFields({
                id,
                config,
                data: row,
                fields: field.fields,
                fullData,
                locale,
                operation,
                parentPassesCondition: passesCondition,
                path: rowPath,
                preferences,
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
          fieldState.initialValue = null
        } else {
          fieldState.value = arrayValue.length
          fieldState.initialValue = arrayValue.length

          if (arrayValue.length > 0) {
            fieldState.disableFormData = true
          }
        }

        fieldState.rows = rowMetadata

        // Add field to state
        state[`${path}${field.name}`] = fieldState

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

              state[`${rowPath}id`] = {
                initialValue: row.id,
                valid: true,
                value: row.id,
              }

              state[`${rowPath}blockType`] = {
                initialValue: row.blockType,
                valid: true,
                value: row.blockType,
              }

              state[`${rowPath}blockName`] = {
                initialValue: row.blockName,
                valid: true,
                value: row.blockName,
              }

              acc.promises.push(
                iterateFields({
                  id,
                  config,
                  data: row,
                  fields: block.fields,
                  fullData,
                  locale,
                  operation,
                  parentPassesCondition: passesCondition,
                  path: rowPath,
                  preferences,
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
          fieldState.initialValue = null
        } else {
          fieldState.value = blocksValue.length
          fieldState.initialValue = blocksValue.length

          if (blocksValue.length > 0) {
            fieldState.disableFormData = true
          }
        }

        fieldState.rows = rowMetadata

        // Add field to state
        state[`${path}${field.name}`] = fieldState

        break
      }

      case 'group': {
        await iterateFields({
          id,
          config,
          data: data?.[field.name] || {},
          fields: field.fields,
          fullData,
          locale,
          operation,
          parentPassesCondition: passesCondition,
          path: `${path}${field.name}.`,
          preferences,
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
      config,
      data,
      fields: field.fields,
      fullData,
      locale,
      operation,
      parentPassesCondition: passesCondition,
      path,
      preferences,
      state,
      t,
      user,
    })
  } else if (field.type === 'tabs') {
    const promises = field.tabs.map((tab) =>
      iterateFields({
        id,
        config,
        data: tabHasName(tab) ? data?.[tab.name] : data,
        fields: tab.fields,
        fullData,
        locale,
        operation,
        parentPassesCondition: passesCondition,
        path: tabHasName(tab) ? `${path}${tab.name}.` : path,
        preferences,
        state,
        t,
        user,
      }),
    )

    await Promise.all(promises)
  }
}
