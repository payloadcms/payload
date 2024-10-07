import type { Field, TabAsField } from 'payload'

import ObjectIdImport from 'bson-objectid'
import mongoose from 'mongoose'
import { createArrayFromCommaDelineated } from 'payload'

type SanitizeQueryValueArgs = {
  field: Field | TabAsField
  hasCustomID: boolean
  operator: string
  path: string
  val: any
}

const buildExistsQuery = (formattedValue, path) => {
  if (formattedValue) {
    return {
      rawQuery: {
        $and: [
          { [path]: { $exists: true } },
          { [path]: { $ne: null } },
          { [path]: { $ne: '' } }, // Exclude null and empty string
        ],
      },
    }
  } else {
    return {
      rawQuery: {
        $or: [
          { [path]: { $exists: false } },
          { [path]: { $eq: null } },
          { [path]: { $eq: '' } }, // Treat empty string as null / undefined
        ],
      },
    }
  }
}

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default
export const sanitizeQueryValue = ({
  field,
  hasCustomID,
  operator,
  path,
  val,
}: SanitizeQueryValueArgs): {
  operator?: string
  rawQuery?: unknown
  val?: unknown
} => {
  let formattedValue = val
  let formattedOperator = operator

  // Disregard invalid _ids
  if (path === '_id') {
    if (typeof val === 'string' && val.split(',').length === 1) {
      if (!hasCustomID) {
        const isValid = mongoose.Types.ObjectId.isValid(val)

        if (!isValid) {
          return { operator: formattedOperator, val: undefined }
        } else {
          if (['in', 'not_in'].includes(operator)) {
            formattedValue = createArrayFromCommaDelineated(formattedValue).map((id) =>
              ObjectId(id),
            )
          } else {
            formattedValue = ObjectId(val)
          }
        }
      }

      if (field.type === 'number') {
        const parsedNumber = parseFloat(val)

        if (Number.isNaN(parsedNumber)) {
          return { operator: formattedOperator, val: undefined }
        }
      }
    } else if (Array.isArray(val)) {
      formattedValue = formattedValue.reduce((formattedValues, inVal) => {
        const newValues = [inVal]
        if (!hasCustomID) {
          if (mongoose.Types.ObjectId.isValid(inVal)) {
            newValues.push(ObjectId(inVal))
          }
        }

        if (field.type === 'number') {
          const parsedNumber = parseFloat(inVal)
          if (!Number.isNaN(parsedNumber)) {
            newValues.push(parsedNumber)
          }
        }

        return [...formattedValues, ...newValues]
      }, [])
    }
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

  if (['all', 'in', 'not_in'].includes(operator) && typeof formattedValue === 'string') {
    formattedValue = createArrayFromCommaDelineated(formattedValue)

    if (field.type === 'number') {
      formattedValue = formattedValue.map((arrayVal) => parseFloat(arrayVal))
    }
  }

  if (field.type === 'number') {
    if (typeof formattedValue === 'string' && operator !== 'exists') {
      formattedValue = Number(val)
    }

    if (operator === 'exists') {
      formattedValue = val === 'true' ? true : val === 'false' ? false : Boolean(val)

      return buildExistsQuery(formattedValue, path)
    }
  }

  if (field.type === 'date' && typeof val === 'string' && operator !== 'exists') {
    formattedValue = new Date(val)
    if (Number.isNaN(Date.parse(formattedValue))) {
      return undefined
    }
  }

  if (['relationship', 'upload'].includes(field.type)) {
    if (val === 'null') {
      formattedValue = null
    }

    // Object equality requires the value to be the first key in the object that is being queried.
    if (
      operator === 'equals' &&
      formattedValue &&
      typeof formattedValue === 'object' &&
      formattedValue.value &&
      formattedValue.relationTo
    ) {
      const { value } = formattedValue
      const isValid = mongoose.Types.ObjectId.isValid(value)

      if (isValid) {
        formattedValue.value = ObjectId(value)
      }

      return {
        rawQuery: {
          $and: [
            { [`${path}.value`]: { $eq: formattedValue.value } },
            { [`${path}.relationTo`]: { $eq: formattedValue.relationTo } },
          ],
        },
      }
    }

    if (['in', 'not_in'].includes(operator) && Array.isArray(formattedValue)) {
      formattedValue = formattedValue.reduce((formattedValues, inVal) => {
        const newValues = [inVal]
        if (mongoose.Types.ObjectId.isValid(inVal)) {
          newValues.push(ObjectId(inVal))
        }

        const parsedNumber = parseFloat(inVal)
        if (!Number.isNaN(parsedNumber)) {
          newValues.push(parsedNumber)
        }

        return [...formattedValues, ...newValues]
      }, [])
    }

    if (operator === 'contains' && typeof formattedValue === 'string') {
      if (mongoose.Types.ObjectId.isValid(formattedValue)) {
        formattedValue = ObjectId(formattedValue)
      }
    }
  }

  // Set up specific formatting necessary by operators

  if (operator === 'near') {
    let lng
    let lat
    let maxDistance
    let minDistance

    if (Array.isArray(formattedValue)) {
      ;[lng, lat, maxDistance, minDistance] = formattedValue
    }

    if (typeof formattedValue === 'string') {
      ;[lng, lat, maxDistance, minDistance] = createArrayFromCommaDelineated(formattedValue)
    }

    if (lng == null || lat == null || (maxDistance == null && minDistance == null)) {
      formattedValue = undefined
    } else {
      formattedValue = {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      }

      if (maxDistance) {
        formattedValue.$maxDistance = parseFloat(maxDistance)
      }
      if (minDistance) {
        formattedValue.$minDistance = parseFloat(minDistance)
      }
    }
  }

  if (operator === 'within' || operator === 'intersects') {
    formattedValue = {
      $geometry: formattedValue,
    }
  }

  if (path !== '_id' || (path === '_id' && hasCustomID && field.type === 'text')) {
    if (operator === 'contains' && !mongoose.Types.ObjectId.isValid(formattedValue)) {
      formattedValue = {
        $options: 'i',
        $regex: formattedValue.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&'),
      }
    }

    if (operator === 'exists') {
      formattedValue = formattedValue === 'true' || formattedValue === true

      return buildExistsQuery(formattedValue, path)
    }
  }

  if (
    (path === '_id' || path === 'parent') &&
    operator === 'like' &&
    formattedValue.length === 24 &&
    !hasCustomID
  ) {
    formattedOperator = 'equals'
  }

  if (operator === 'exists') {
    formattedValue = formattedValue === 'true' || formattedValue === true

    // Clearable fields
    if (['relationship', 'select', 'upload'].includes(field.type)) {
      if (formattedValue) {
        return {
          rawQuery: {
            $and: [{ [path]: { $exists: true } }, { [path]: { $ne: null } }],
          },
        }
      } else {
        return {
          rawQuery: {
            $or: [{ [path]: { $exists: false } }, { [path]: { $eq: null } }],
          },
        }
      }
    }
  }

  return { operator: formattedOperator, val: formattedValue }
}
