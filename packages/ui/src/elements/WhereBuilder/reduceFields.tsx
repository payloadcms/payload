'use client'
import type { ClientTranslationKeys, I18nClient } from '@payloadcms/translations'
import type { ClientField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { fieldIsHiddenOrDisabled, fieldIsID, tabHasName } from 'payload/shared'

import type { ReducedField } from './types.js'

import { createNestedClientFieldPath } from '../../forms/Form/createNestedClientFieldPath.js'
import { combineFieldLabel } from '../../utilities/combineFieldLabel.js'
import fieldTypes from './field-types.js'

type ReduceFieldOptionsArgs = {
  fields: ClientField[]
  i18n: I18nClient
  labelPrefix?: string
  pathPrefix?: string
}

/**
 * Reduces a field map to a flat array of fields with labels and values.
 * Used in the WhereBuilder component to render the fields in the dropdown.
 */
export const reduceFields = ({
  fields,
  i18n,
  labelPrefix,
  pathPrefix,
}: ReduceFieldOptionsArgs): ReducedField[] => {
  return fields.reduce((reduced, field) => {
    // Do not filter out `field.admin.disableListFilter` fields here, as these should still render as disabled if they appear in the URL query
    if (fieldIsHiddenOrDisabled(field) && !fieldIsID(field)) {
      return reduced
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      const tabs = field.tabs

      tabs.forEach((tab) => {
        if (typeof tab.label !== 'boolean') {
          const localizedTabLabel = getTranslation(tab.label, i18n)

          const labelWithPrefix = labelPrefix
            ? labelPrefix + ' > ' + localizedTabLabel
            : localizedTabLabel

          // Make sure we handle nested tabs
          const tabPathPrefix =
            tabHasName(tab) && tab.name
              ? pathPrefix
                ? pathPrefix + '.' + tab.name
                : tab.name
              : pathPrefix

          if (typeof localizedTabLabel === 'string') {
            reduced.push(
              ...reduceFields({
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
        ...reduceFields({
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
        ...reduceFields({
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
        ...reduceFields({
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
        ? combineFieldLabel({
            field,
            prefix: labelPrefix,
          })
        : localizedLabel

      const fieldPath = pathPrefix ? createNestedClientFieldPath(pathPrefix, field) : field.name

      const formattedField: ReducedField = {
        label: formattedLabel,
        value: fieldPath,
        ...fieldTypes[field.type],
        field,
        operators,
      }

      reduced.push(formattedField)
      return reduced
    }
    return reduced
  }, [])
}
