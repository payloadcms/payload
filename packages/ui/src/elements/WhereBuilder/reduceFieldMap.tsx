'use client'
import type { FieldMap } from '../../utilities/buildComponentMap.js'

import { createNestedClientFieldPath } from '../../forms/Form/createNestedFieldPath.js'
import { combineLabel } from '../FieldSelect/index.js'
import fieldTypes from './field-types.js'

export const reduceFieldMap = (
  fieldMap: FieldMap,
  i18n,
  labelPrefix?: string,
  pathPrefix?: string,
  locale?: string,
) => {
  return fieldMap.reduce((reduced, field) => {
    if (field.disableListFilter) return reduced

    if (field.type === 'tabs' && 'tabs' in field.fieldComponentProps) {
      const tabs = field.fieldComponentProps.tabs
      tabs.forEach((tab) => {
        if (tab.name && typeof tab.label === 'string' && tab.fieldMap) {
          reduced.push(...reduceFieldMap(tab.fieldMap, i18n, tab.label, tab.name))
        }
      })
      return reduced
    }

    if (field.type === 'group' && 'fieldMap' in field.fieldComponentProps) {
      reduced.push(
        ...reduceFieldMap(
          field.fieldComponentProps.fieldMap,
          i18n,
          field.fieldComponentProps.label as string,
          field.name,
        ),
      )
      return reduced
    }

    if (typeof fieldTypes[field.type] === 'object') {
      const operatorKeys = new Set()
      const operators = fieldTypes[field.type].operators.reduce((acc, operator) => {
        if (!operatorKeys.has(operator.value)) {
          operatorKeys.add(operator.value)
          acc.push({
            ...operator,
            label: i18n.t(`operators:${operator.label}`),
          })
        }
        return acc
      }, [])

      const localizedLabel =
        locale && typeof field.fieldComponentProps.label === 'object'
          ? field.fieldComponentProps.label[locale]
          : field.fieldComponentProps.label

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
