import type { Field, TabAsField } from 'payload/dist/fields/config/types'

import mongoose from 'mongoose'

import { createArrayFromCommaDelineated } from '../utilities/createArrayFromCommaDelineated'

type SanitizeQueryValueArgs = {
  field: Field | TabAsField
  hasCustomID: boolean
  operator: string
  path: string
  val: any
}

export const sanitizeQueryValue = ({
  field,
  hasCustomID,
  operator,
  path,
  val,
}: SanitizeQueryValueArgs): unknown => {
  let formattedValue = val

  // Disregard invalid _ids
  if (path === '_id' && typeof val === 'string' && val.split(',').length === 1) {
    if (!hasCustomID) {
      const isValid = mongoose.Types.ObjectId.isValid(val)

      if (!isValid) {
        return undefined
      }
    }

    if (field.type === 'number') {
      const parsedNumber = parseFloat(val)

      if (Number.isNaN(parsedNumber)) {
        return undefined
      }
    }
  }

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

  if (field.type === 'date' && typeof val === 'string') {
    formattedValue = new Date(val)
    if (Number.isNaN(Date.parse(formattedValue))) {
      return undefined
    }
  }

  if (['relationship', 'upload'].includes(field.type)) {
    if (val === 'null') {
      formattedValue = null
    }

    if (operator === 'in' && Array.isArray(formattedValue)) {
      formattedValue = formattedValue.reduce((formattedValues, inVal) => {
        const newValues = [inVal]
        if (mongoose.Types.ObjectId.isValid(inVal))
          newValues.push(new mongoose.Types.ObjectId(inVal))

        const parsedNumber = parseFloat(inVal)
        if (!Number.isNaN(parsedNumber)) newValues.push(parsedNumber)

        return [...formattedValues, ...newValues]
      }, [])
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
        $geometry: { coordinates: [parseFloat(lng), parseFloat(lat)], type: 'Point' },
      }

      if (maxDistance) formattedValue.$maxDistance = parseFloat(maxDistance)
      if (minDistance) formattedValue.$minDistance = parseFloat(minDistance)
    }
  }

  if (operator === 'within' || operator === 'intersects') {
    formattedValue = {
      $geometry: formattedValue,
    }
  }

  if (path !== '_id' || (path === '_id' && hasCustomID && field.type === 'text')) {
    if (operator === 'contains') {
      formattedValue = { $options: 'i', $regex: formattedValue }
    }
  }

  if (operator === 'exists') {
    formattedValue = formattedValue === 'true' || formattedValue === true
  }

  return formattedValue
}
