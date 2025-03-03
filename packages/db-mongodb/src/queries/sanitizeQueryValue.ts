import type {
  FlattenedBlock,
  FlattenedBlocksField,
  FlattenedField,
  Payload,
  RelationshipField,
} from 'payload'

import { Types } from 'mongoose'
import { createArrayFromCommaDelineated } from 'payload'
import { fieldShouldBeLocalized } from 'payload/shared'

type SanitizeQueryValueArgs = {
  field: FlattenedField
  hasCustomID: boolean
  locale?: string
  operator: string
  parentIsLocalized: boolean
  path: string
  payload: Payload
  val: any
}

const buildExistsQuery = (formattedValue: unknown, path: string, treatEmptyString = true) => {
  if (formattedValue) {
    return {
      rawQuery: {
        $and: [
          { [path]: { $exists: true } },
          { [path]: { $ne: null } },
          ...(treatEmptyString ? [{ [path]: { $ne: '' } }] : []), // Treat empty string as null / undefined
        ],
      },
    }
  } else {
    return {
      rawQuery: {
        $or: [
          { [path]: { $exists: false } },
          { [path]: { $eq: null } },
          ...(treatEmptyString ? [{ [path]: { $eq: '' } }] : []), // Treat empty string as null / undefined
        ],
      },
    }
  }
}

// returns nestedField Field object from blocks.nestedField path because getLocalizedPaths splits them only for relationships
const getFieldFromSegments = ({
  field,
  payload,
  segments,
}: {
  field: FlattenedBlock | FlattenedField
  payload: Payload
  segments: string[]
}): FlattenedField | undefined => {
  if ('blocks' in field || 'blockReferences' in field) {
    const _field: FlattenedBlocksField = field as FlattenedBlocksField
    for (const _block of _field.blockReferences ?? _field.blocks) {
      const block: FlattenedBlock | undefined =
        typeof _block === 'string' ? payload.blocks[_block] : _block
      if (block) {
        const field = getFieldFromSegments({ field: block, payload, segments })
        if (field) {
          return field
        }
      }
    }
  }

  if ('fields' in field) {
    for (let i = 0; i < segments.length; i++) {
      const foundField = field.flattenedFields.find((each) => each.name === segments[i])

      if (!foundField) {
        break
      }

      if (foundField && segments.length - 1 === i) {
        return foundField
      }

      segments.shift()
      return getFieldFromSegments({ field: foundField, payload, segments })
    }
  }
}

export const sanitizeQueryValue = ({
  field,
  hasCustomID,
  locale,
  operator,
  parentIsLocalized,
  path,
  payload,
  val,
}: SanitizeQueryValueArgs):
  | {
      operator?: string
      rawQuery?: unknown
      val?: unknown
    }
  | undefined => {
  let formattedValue = val
  let formattedOperator = operator
  if (['array', 'blocks', 'group', 'tab'].includes(field.type) && path.includes('.')) {
    const segments = path.split('.')
    segments.shift()
    const foundField = getFieldFromSegments({ field, payload, segments })

    if (foundField) {
      field = foundField
    }
  }

  // Disregard invalid _ids
  if (path === '_id') {
    if (typeof val === 'string' && val.split(',').length === 1) {
      if (!hasCustomID) {
        const isValid = Types.ObjectId.isValid(val)

        if (!isValid) {
          return { operator: formattedOperator, val: undefined }
        } else {
          if (['in', 'not_in'].includes(operator)) {
            formattedValue = createArrayFromCommaDelineated(formattedValue).map(
              (id) => new Types.ObjectId(id),
            )
          } else {
            formattedValue = new Types.ObjectId(val)
          }
        }
      }

      if (field.type === 'number') {
        const parsedNumber = parseFloat(val)

        if (Number.isNaN(parsedNumber)) {
          return { operator: formattedOperator, val: undefined }
        }
      }
    } else if (Array.isArray(val) || (typeof val === 'string' && val.split(',').length > 1)) {
      if (typeof val === 'string') {
        formattedValue = createArrayFromCommaDelineated(val)
      }

      if (Array.isArray(formattedValue)) {
        formattedValue = formattedValue.reduce<unknown[]>((formattedValues, inVal) => {
          if (!hasCustomID) {
            if (Types.ObjectId.isValid(inVal)) {
              formattedValues.push(new Types.ObjectId(inVal))
            }
          }

          if (field.type === 'number') {
            const parsedNumber = parseFloat(inVal)
            if (!Number.isNaN(parsedNumber)) {
              formattedValues.push(parsedNumber)
            }
          } else {
            formattedValues.push(inVal)
          }

          return formattedValues
        }, [])
      }
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

    if (field.type === 'number' && Array.isArray(formattedValue)) {
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
      const isValid = Types.ObjectId.isValid(value)

      if (isValid) {
        formattedValue.value = new Types.ObjectId(value)
      }

      let localizedPath = path

      if (
        fieldShouldBeLocalized({ field, parentIsLocalized }) &&
        payload.config.localization &&
        locale
      ) {
        localizedPath = `${path}.${locale}`
      }

      return {
        rawQuery: {
          $or: [
            {
              [localizedPath]: {
                $eq: {
                  // disable auto sort
                  /* eslint-disable */
                  value: formattedValue.value,
                  relationTo: formattedValue.relationTo,
                  /* eslint-enable */
                },
              },
            },
            {
              [localizedPath]: {
                $eq: {
                  relationTo: formattedValue.relationTo,
                  value: formattedValue.value,
                },
              },
            },
          ],
        },
      }
    }

    const relationTo = (field as RelationshipField).relationTo

    if (['in', 'not_in'].includes(operator) && Array.isArray(formattedValue)) {
      formattedValue = formattedValue.reduce((formattedValues, inVal) => {
        if (!inVal) {
          return formattedValues
        }

        if (typeof relationTo === 'string' && payload.collections[relationTo]?.customIDType) {
          if (payload.collections[relationTo].customIDType === 'number') {
            const parsedNumber = parseFloat(inVal)
            if (!Number.isNaN(parsedNumber)) {
              formattedValues.push(parsedNumber)
              return formattedValues
            }
          }

          formattedValues.push(inVal)
          return formattedValues
        }

        if (
          Array.isArray(relationTo) &&
          relationTo.some((relationTo) => !!payload.collections[relationTo]?.customIDType)
        ) {
          if (Types.ObjectId.isValid(inVal.toString())) {
            formattedValues.push(new Types.ObjectId(inVal))
          } else {
            formattedValues.push(inVal)
          }
          return formattedValues
        }

        if (Types.ObjectId.isValid(inVal.toString())) {
          formattedValues.push(new Types.ObjectId(inVal))
        }

        return formattedValues
      }, [])
    }

    if (
      ['contains', 'equals', 'like', 'not_equals'].includes(operator) &&
      (!Array.isArray(relationTo) || !path.endsWith('.relationTo'))
    ) {
      if (typeof relationTo === 'string') {
        const customIDType = payload.collections[relationTo]?.customIDType

        if (customIDType) {
          if (customIDType === 'number') {
            formattedValue = parseFloat(val)

            if (Number.isNaN(formattedValue)) {
              return { operator: formattedOperator, val: undefined }
            }
          }
        } else {
          if (!Types.ObjectId.isValid(formattedValue)) {
            return { operator: formattedOperator, val: undefined }
          }
          formattedValue = new Types.ObjectId(formattedValue)
        }
      } else {
        const hasCustomIDType = relationTo.some(
          (relationTo) => !!payload.collections[relationTo]?.customIDType,
        )

        if (hasCustomIDType) {
          if (typeof val === 'string') {
            const formattedNumber = Number(val)
            formattedValue = [Types.ObjectId.isValid(val) ? new Types.ObjectId(val) : val]
            formattedOperator = operator === 'not_equals' ? 'not_in' : 'in'
            if (!Number.isNaN(formattedNumber)) {
              formattedValue.push(formattedNumber)
            }
          }
        } else {
          if (!Types.ObjectId.isValid(formattedValue)) {
            return { operator: formattedOperator, val: undefined }
          }
          formattedValue = new Types.ObjectId(formattedValue)
        }
      }
    }

    if (
      operator === 'all' &&
      Array.isArray(relationTo) &&
      path.endsWith('.value') &&
      Array.isArray(formattedValue)
    ) {
      formattedValue.forEach((v, i) => {
        if (Types.ObjectId.isValid(v)) {
          formattedValue[i] = new Types.ObjectId(v)
        }
      })
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

      if (maxDistance && !Number.isNaN(Number(maxDistance))) {
        formattedValue.$maxDistance = parseFloat(maxDistance)
      }

      if (minDistance && !Number.isNaN(Number(minDistance))) {
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
    if (operator === 'contains' && !Types.ObjectId.isValid(formattedValue)) {
      formattedValue = {
        $options: 'i',
        $regex: formattedValue.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&'),
      }
    }

    if (operator === 'exists') {
      formattedValue = formattedValue === 'true' || formattedValue === true

      // _id can't be empty string, will error Cast to ObjectId failed for value ""
      return buildExistsQuery(
        formattedValue,
        path,
        !['relationship', 'upload'].includes(field.type),
      )
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
