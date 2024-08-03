'use client'
import type { ClientTranslationKeys, I18nClient } from '@payloadcms/translations'
import type { ClientFieldConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type { FieldCondition } from './types.js'

import { createNestedClientFieldPath } from '../../forms/Form/createNestedFieldPath.js'
import { combineLabel } from '../FieldSelect/index.js'
import fieldTypes from './field-types.js'

export type ReduceFieldMapArgs = {
  fields: ClientFieldConfig[]
  i18n: I18nClient
  labelPrefix?: string
  pathPrefix?: string
}

/**
 * Reduces a field map to a flat array of fields with labels and values.
 * Used in the WhereBuilder component to render the fields in the dropdown.
 */
export const reduceFieldMap = ({
  fields,
  i18n,
  labelPrefix,
  pathPrefix,
}: ReduceFieldMapArgs): FieldCondition[] => {
  return fields.reduce((reduced, field) => {
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
                fields: tab.fields,
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
    if (field.type === 'row' && 'fields' in field) {
      reduced.push(
        ...reduceFieldMap({
          fields: field.fields,
          i18n,
          labelPrefix,
          pathPrefix,
        }),
      )
      return reduced
    }

    if (field.type === 'collapsible' && 'fields' in field) {
      const localizedTabLabel = getTranslation(field.label || '', i18n)

      const labelWithPrefix = labelPrefix
        ? labelPrefix + ' > ' + localizedTabLabel
        : localizedTabLabel

      reduced.push(
        ...reduceFieldMap({
          fields: field.fields,
          i18n,
          labelPrefix: labelWithPrefix,
          pathPrefix,
        }),
      )
      return reduced
    }

    if (field.type === 'group' && 'fields' in field) {
      const translatedLabel = getTranslation(field.label || '', i18n)

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
          fields: field.fields,
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

      const localizedLabel = getTranslation(field.label || '', i18n)

      const formattedLabel = labelPrefix
        ? combineLabel({
            field,
            prefix: labelPrefix,
          })
        : localizedLabel

      const formattedValue = pathPrefix
        ? createNestedClientFieldPath(pathPrefix, field)
        : field.name

      const formattedField: FieldCondition = {
        Filter: field.admin?.components?.Filter,
        label: formattedLabel,
        value: formattedValue,
        ...fieldTypes[field.type],
        operators,
        props: {
          ...field,
          ...(field?.admin?.components?.Cell || {}),
        },
      }

      reduced.push(formattedField)
      return reduced
    }

    return reduced
  }, [])
}
