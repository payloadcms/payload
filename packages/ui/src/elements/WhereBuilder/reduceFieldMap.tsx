'use client'
import type { ClientTranslationKeys, I18nClient } from '@payloadcms/translations'
import type { FieldMap } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import { createNestedClientFieldPath } from '../../forms/Form/createNestedFieldPath.js'
import { combineLabel } from '../FieldSelect/index.js'
import fieldTypes from './field-types.js'

export type ReduceFieldMapArgs = {
  fieldMap: FieldMap
  i18n: I18nClient
  labelPrefix?: string
  pathPrefix?: string
}

/**
 * Reduces a field map to a flat array of fields with labels and values.
 * Used in the WhereBuilder component to render the fields in the dropdown.
 */
export const reduceFieldMap = ({ fieldMap, i18n, labelPrefix, pathPrefix }: ReduceFieldMapArgs) => {
  return fieldMap.reduce((reduced, field) => {
    if (field.disableListFilter) return reduced

    if (field.type === 'tabs' && 'tabs' in field.fieldComponentProps) {
      const tabs = field.fieldComponentProps.tabs

      tabs.forEach((tab) => {
        if (typeof tab.label !== 'boolean') {
          const localizedTabLabel = getTranslation(tab.label, i18n)

          const labelWithPrefix = labelPrefix
            ? labelPrefix + ' > ' + localizedTabLabel
            : localizedTabLabel

          // Make sure we handle nested tabs
          const tabPathPrefix = tab.name
            ? pathPrefix
              ? pathPrefix + '.' + tab.name
              : tab.name
            : pathPrefix

          if (typeof localizedTabLabel === 'string') {
            reduced.push(
              ...reduceFieldMap({
                fieldMap: tab.fieldMap,
                i18n,
                labelPrefix: labelWithPrefix,
                pathPrefix: tabPathPrefix,
              }),
            )
          }
        }
      })
      return reduced
    }

    // Rows cant have labels, so we need to handle them differently
    if (field.type === 'row' && 'fieldMap' in field.fieldComponentProps) {
      reduced.push(
        ...reduceFieldMap({
          fieldMap: field.fieldComponentProps.fieldMap,
          i18n,
          labelPrefix,
          pathPrefix,
        }),
      )
      return reduced
    }

    if (field.type === 'collapsible' && 'fieldMap' in field.fieldComponentProps) {
      const localizedTabLabel = getTranslation(field.fieldComponentProps.label || '', i18n)

      const labelWithPrefix = labelPrefix
        ? labelPrefix + ' > ' + localizedTabLabel
        : localizedTabLabel

      reduced.push(
        ...reduceFieldMap({
          fieldMap: field.fieldComponentProps.fieldMap,
          i18n,
          labelPrefix: labelWithPrefix,
          pathPrefix,
        }),
      )
      return reduced
    }

    if (field.type === 'group' && 'fieldMap' in field.fieldComponentProps) {
      const translatedLabel = getTranslation(field.fieldComponentProps.label || '', i18n)

      const labelWithPrefix = labelPrefix
        ? translatedLabel
          ? labelPrefix + ' > ' + translatedLabel
          : labelPrefix
        : translatedLabel

      // Make sure we handle deeply nested groups
      const pathWithPrefix = field.name
        ? pathPrefix
          ? pathPrefix + '.' + field.name
          : field.name
        : pathPrefix

      reduced.push(
        ...reduceFieldMap({
          fieldMap: field.fieldComponentProps.fieldMap,
          i18n,
          labelPrefix: labelWithPrefix,
          pathPrefix: pathWithPrefix,
        }),
      )
      return reduced
    }

    if (typeof fieldTypes[field.type] === 'object') {
      const operatorKeys = new Set()
      const operators = fieldTypes[field.type].operators.reduce((acc, operator) => {
        if (!operatorKeys.has(operator.value)) {
          operatorKeys.add(operator.value)
          const operatorKey = `operators:${operator.label}` as ClientTranslationKeys
          acc.push({
            ...operator,
            label: i18n.t(operatorKey),
          })
        }
        return acc
      }, [])

      const localizedLabel = getTranslation(field.fieldComponentProps.label || '', i18n)

      const formattedLabel = labelPrefix
        ? combineLabel({
            field,
            prefix: labelPrefix,
          })
        : localizedLabel

      const formattedValue = pathPrefix
        ? createNestedClientFieldPath(pathPrefix, field)
        : field.name

      const formattedField = {
        label: formattedLabel,
        value: formattedValue,
        ...fieldTypes[field.type],
        operators,
        props: {
          ...field,
          ...(field?.cellComponentProps || {}),
        },
      }

      reduced.push(formattedField)
      return reduced
    }

    return reduced
  }, [])
}
