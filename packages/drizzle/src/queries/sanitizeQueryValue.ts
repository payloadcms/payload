import { APIError, createArrayFromCommaDelineated, type Field, type TabAsField } from 'payload'
import { fieldAffectsData } from 'payload/shared'

import type { DrizzleAdapter } from '../types.js'

type SanitizeQueryValueArgs = {
  adapter: DrizzleAdapter
  field: Field | TabAsField
  operator: string
  relationOrPath: string
  val: any
}

export const sanitizeQueryValue = ({
  adapter,
  field,
  operator: operatorArg,
  relationOrPath,
  val,
}: SanitizeQueryValueArgs): { operator: string; value: unknown } => {
  let operator = operatorArg
  let formattedValue = val

  if (!fieldAffectsData(field)) {
    return { operator, value: formattedValue }
  }

  if (
    (field.type === 'relationship' || field.type === 'upload') &&
    !relationOrPath.endsWith('relationTo') &&
    Array.isArray(formattedValue)
  ) {
    const allPossibleIDTypes: (number | string)[] = []
    formattedValue.forEach((val) => {
      if (adapter.idType !== 'uuid' && typeof val === 'string') {
        allPossibleIDTypes.push(val, parseInt(val))
      } else if (typeof val === 'string') {
        allPossibleIDTypes.push(val)
      } else {
        allPossibleIDTypes.push(val, String(val))
      }
    })
    formattedValue = allPossibleIDTypes
  }

  // Cast incoming values as proper searchable types
  if (field.type === 'checkbox' && typeof val === 'string') {
    if (val.toLowerCase() === 'true') {
      formattedValue = true
    }
    if (val.toLowerCase() === 'false') {
      formattedValue = false
    }
  }

  if (['all', 'in', 'not_in'].includes(operator)) {
    if (typeof formattedValue === 'string') {
      formattedValue = createArrayFromCommaDelineated(formattedValue)

      if (field.type === 'number') {
        formattedValue = formattedValue.map((arrayVal) => parseFloat(arrayVal))
      }
    }

    if (!Array.isArray(formattedValue) || formattedValue.length === 0) {
      return null
    }
  }

  if (field.type === 'number' && typeof formattedValue === 'string') {
    formattedValue = Number(val)
  }

  if (field.type === 'date' && operator !== 'exists') {
    if (typeof val === 'string') {
      formattedValue = new Date(val).toISOString()
      if (Number.isNaN(Date.parse(formattedValue))) {
        return { operator, value: undefined }
      }
    } else if (typeof val === 'number') {
      formattedValue = new Date(val).toISOString()
    }
  }

  if (field.type === 'relationship' || field.type === 'upload') {
    if (val === 'null') {
      formattedValue = null
    } else if (!(formattedValue === null || typeof formattedValue === 'boolean')) {
      // convert the value to the idType of the relationship
      let idType: 'number' | 'text'
      if (typeof field.relationTo === 'string') {
        const collection = adapter.payload.collections[field.relationTo]
        const mixedType: 'number' | 'serial' | 'text' | 'uuid' =
          collection.customIDType || adapter.idType
        const typeMap: Record<string, 'number' | 'text'> = {
          number: 'number',
          serial: 'number',
          text: 'text',
          uuid: 'text',
        }
        idType = typeMap[mixedType]
      } else {
        const hasCollectionWithCustomID = field.relationTo.some(
          (each) => !!adapter.payload.collections[each].customIDType,
        )
        idType = hasCollectionWithCustomID || adapter.idType === 'uuid' ? 'text' : 'number'
      }
      if (Array.isArray(formattedValue)) {
        formattedValue = formattedValue.map((value) => {
          if (idType === 'number') {
            return Number(value)
          }
          if (idType === 'text') {
            return String(value)
          }
          return value
        })
      } else {
        if (idType === 'number') {
          formattedValue = Number(val)
        }
        if (idType === 'text') {
          formattedValue = String(val)
        }
      }
    }
  }

  if ('hasMany' in field && field.hasMany && operator === 'contains') {
    operator = 'equals'
  }

  if (operator === 'near' || operator === 'within' || operator === 'intersects') {
    throw new APIError(
      `Querying with '${operator}' is not supported with the postgres database adapter.`,
    )
  }

  if (operator === 'contains') {
    formattedValue = `%${formattedValue}%`
  }

  if (operator === 'exists') {
    formattedValue = formattedValue === 'true' || formattedValue === true
    if (formattedValue === false) {
      operator = 'isNull'
    }
  }

  return { operator, value: formattedValue }
}
