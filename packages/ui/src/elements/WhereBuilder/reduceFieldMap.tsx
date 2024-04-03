import { FieldLabel } from '@payloadcms/ui/forms/FieldLabel'
import React from 'react'

import type { FieldMap } from '../../utilities/buildComponentMap.js'

import fieldTypes from './field-types.js'

export const reduceFieldMap = (fieldMap: FieldMap, i18n) =>
  fieldMap.reduce((reduced, field) => {
    if (typeof fieldTypes[field.type] === 'object') {
      const operatorKeys = new Set()
      const operators = fieldTypes[field.type].operators.reduce((acc, operator) => {
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
        label: (
          <FieldLabel
            CustomLabel={field.fieldComponentProps.CustomLabel}
            {...field.fieldComponentProps.labelProps}
          />
        ),
        value: field.name,
        ...fieldTypes[field.type],
        operators,
        props: {
          ...field,
        },
      }

      return [...reduced, formattedField]
    }

    return reduced
  }, [])
