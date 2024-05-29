'use client'
import type { Column } from '../Table/index.js'

import fieldTypes from './field-types.js'

export const reduceFieldMap = (fieldMap: Column[], i18n) =>
  fieldMap.reduce((reduced, field) => {
    const fieldType: keyof typeof fieldTypes = Array.isArray(field.cellProps?.relationTo)
      ? `relationship_polymorphic`
      : (field.type as keyof typeof fieldTypes)

    if (typeof fieldTypes[fieldType] === 'object') {
      const operatorKeys = new Set()

      const operators = fieldTypes[fieldType].operators.reduce((acc, operator) => {
        if (!operatorKeys.has(operator.value)) {
          operatorKeys.add(operator.value)
          return [
            ...acc,
            {
              ...operator,
              label: i18n.t(`operators:${operator.label}`),
            },
          ]
        }
        return acc
      }, [])

      const formattedField = {
        label: field.Label,
        value: field.name,
        ...fieldTypes[fieldType],
        operators,
        props: {
          ...field,
          ...(field?.cellProps || {}),
        },
      }

      if (field.admin?.disableListFilter) return reduced

      return [...reduced, formattedField]
    }

    return reduced
  }, [])
