import type { SQL } from 'drizzle-orm'

import { APIError, createArrayFromCommaDelineated, type Field, type TabAsField } from 'payload'
import { fieldAffectsData } from 'payload/shared'
import { validate as uuidValidate } from 'uuid'

import type { DrizzleAdapter } from '../types.js'

import { getCollectionIdType } from '../utilities/getCollectionIdType.js'
import { isPolymorphicRelationship } from '../utilities/isPolymorphicRelationship.js'
import { isRawConstraint } from '../utilities/rawConstraint.js'

type SanitizeQueryValueArgs = {
  adapter: DrizzleAdapter
  columns?: {
    idType: 'number' | 'text' | 'uuid'
    rawColumn: SQL<unknown>
  }[]
  field: Field | TabAsField
  isUUID: boolean
  operator: string
  relationOrPath: string
  val: any
}

type SanitizedColumn = {
  rawColumn: SQL<unknown>
  value: unknown
}

export const sanitizeQueryValue = ({
  adapter,
  columns,
  field,
  isUUID,
  operator: operatorArg,
  relationOrPath,
  val,
}: SanitizeQueryValueArgs): {
  columns?: SanitizedColumn[]
  operator: string
  value: unknown
} => {
  let operator = operatorArg
  let formattedValue = val
  let formattedColumns: SanitizedColumn[]

  if (!fieldAffectsData(field)) {
    return { operator, value: formattedValue }
  }

  if (isRawConstraint(val)) {
    return { operator, value: val.value }
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
    } else if (typeof formattedValue === 'number') {
      formattedValue = [formattedValue]
    }

    if (!Array.isArray(formattedValue)) {
      return null
    }
  }

  if (field.type === 'number' && typeof formattedValue === 'string') {
    formattedValue = Number(val)

    if (Number.isNaN(formattedValue)) {
      formattedValue = null
    }
  }

  if (isUUID && typeof formattedValue === 'string') {
    if (!uuidValidate(val)) {
      formattedValue = null
    }
  }

  // Helper function to convert a single date value to ISO string
  const convertDateToISO = (item: unknown): unknown => {
    if (typeof item === 'string') {
      if (item === 'null' || item === '') {
        return null
      }
      const date = new Date(item)
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
    } else if (typeof item === 'number') {
      return new Date(item).toISOString()
    } else if (item instanceof Date) {
      return item.toISOString()
    }
    return item
  }

  if (field.type === 'date' && operator !== 'exists') {
    if (Array.isArray(formattedValue)) {
      // Handle arrays of dates for 'in' and 'not_in' operators
      formattedValue = formattedValue.map(convertDateToISO).filter((item) => item !== undefined)
    } else {
      const converted = convertDateToISO(val)
      if (converted === undefined) {
        return { operator, value: undefined }
      }
      formattedValue = converted
    }
  }

  if (field.type === 'relationship' || field.type === 'upload') {
    if (val === 'null') {
      formattedValue = null
    } else if (!(formattedValue === null || typeof formattedValue === 'boolean')) {
      // convert the value to the idType of the relationship
      let idType: 'number' | 'text'
      if (typeof field.relationTo === 'string') {
        idType = getCollectionIdType({
          adapter,
          collection: adapter.payload.collections[field.relationTo],
        })
      } else {
        if (isPolymorphicRelationship(val)) {
          if (operator !== 'equals') {
            throw new APIError(
              `Only 'equals' operator is supported for polymorphic relationship object notation. Given - ${operator}`,
            )
          }
          idType = getCollectionIdType({
            adapter,
            collection: adapter.payload.collections[val.relationTo],
          })

          if (isRawConstraint(val.value)) {
            return {
              operator,
              value: val.value.value,
            }
          }
          return {
            operator,
            value: idType === 'number' ? Number(val.value) : String(val.value),
          }
        }

        formattedColumns = columns
          .map(({ idType, rawColumn }) => {
            let formattedValue: number | number[] | string | string[]

            if (Array.isArray(val)) {
              formattedValue = val
                .map((eachVal) => {
                  let formattedValue: number | string

                  if (idType === 'number') {
                    formattedValue = Number(eachVal)

                    if (Number.isNaN(formattedValue)) {
                      return null
                    }
                  } else {
                    if (idType === 'uuid' && !uuidValidate(eachVal)) {
                      return null
                    }

                    formattedValue = String(eachVal)
                  }

                  return formattedValue
                })
                .filter(Boolean) as number[] | string[]
            } else if (idType === 'number') {
              formattedValue = Number(val)

              if (Number.isNaN(formattedValue)) {
                return null
              }
            } else {
              formattedValue = String(val)
            }

            return {
              rawColumn,
              value: formattedValue,
            }
          })
          .filter(Boolean)
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

  // For hasMany relationship/upload fields, contains should use equals operator
  if (
    'hasMany' in field &&
    field.hasMany &&
    operator === 'contains' &&
    (field.type === 'relationship' || field.type === 'upload')
  ) {
    operator = 'equals'
  }

  if (operator === 'near' && field.type === 'point' && typeof formattedValue === 'string') {
    const [lng, lat, maxDistance, minDistance] = formattedValue.split(',')

    formattedValue = [Number(lng), Number(lat), Number(maxDistance), Number(minDistance)]
  }

  if (operator === 'contains') {
    // Handle array values for hasMany text/number/select fields
    if (
      Array.isArray(formattedValue) &&
      'hasMany' in field &&
      field.hasMany &&
      ['number', 'select', 'text'].includes(field.type)
    ) {
      // For hasMany text/number/select fields with array values, wrap each element with % for LIKE matching
      formattedValue = formattedValue.map((val) => `%${val}%`)
    } else if (!Array.isArray(formattedValue)) {
      // For non-array values, wrap with % for LIKE matching
      formattedValue = `%${formattedValue}%`
    }
  }

  if (operator === 'exists') {
    formattedValue = val === 'true' || val === true

    if (formattedValue) {
      operator = 'exists'
    } else {
      operator = 'isNull'
    }
  }

  if ((field.type === 'relationship' || field.type === 'upload') && Array.isArray(formattedValue)) {
    if (operator === 'equals') {
      return {
        columns: formattedColumns,
        operator: 'in',
        value: formattedValue,
      }
    } else if (operator === 'not_equals') {
      return {
        columns: formattedColumns,
        operator: 'not_in',
        value: formattedValue,
      }
    }
  }

  return {
    columns: formattedColumns,
    operator,
    value: formattedValue,
  }
}
