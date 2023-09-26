import { APIError } from 'payload/errors'
import { type Field, type TabAsField, fieldAffectsData } from 'payload/types'
import { createArrayFromCommaDelineated } from 'payload/utilities'

type SanitizeQueryValueArgs = {
  field: Field | TabAsField
  operator: string
  val: any
}

export const sanitizeQueryValue = ({
  field,
  operator: operatorArg,
  val,
}: SanitizeQueryValueArgs): { operator: string; value: unknown } => {
  let operator = operatorArg
  let formattedValue = val

  if (!fieldAffectsData(field)) return { operator, value: formattedValue }

  // Cast incoming values as proper searchable types
  if (field.type === 'checkbox' && typeof val === 'string') {
    if (val.toLowerCase() === 'true') formattedValue = true
    if (val.toLowerCase() === 'false') formattedValue = false
  }

  if (['all', 'in', 'not_in'].includes(operator) && typeof formattedValue === 'string') {
    formattedValue = createArrayFromCommaDelineated(formattedValue)

    if (field.type === 'number') {
      formattedValue = formattedValue.map((arrayVal) => parseFloat(arrayVal))
    }
  }

  if (field.type === 'number' && typeof formattedValue === 'string') {
    formattedValue = Number(val)
  }

  if (field.type === 'date') {
    if (typeof val === 'string') {
      formattedValue = new Date(val)
      if (Number.isNaN(Date.parse(formattedValue))) {
        return { operator, value: undefined }
      }
    }

    if (typeof val === 'number') {
      formattedValue = new Date(val)
    }
  }

  if (['relationship', 'upload'].includes(field.type)) {
    if (val === 'null') {
      formattedValue = null
    }
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
