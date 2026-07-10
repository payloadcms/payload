import type { FlattenedBlock, FlattenedField, Operator, Payload, RelationshipField } from 'payload'

import { Schema, Types } from 'mongoose'
import { createArrayFromCommaDelineated, escapeRegExp } from 'payload'
import { fieldShouldBeLocalized } from 'payload/shared'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const isValidUUID = (val: unknown): boolean => typeof val === 'string' && uuidRegex.test(val)

/**
 * Whether the adapter is configured to use UUID (`mongoose.Schema.Types.UUID`) for the
 * default `_id` of collections that don't declare their own custom `id` field.
 */
const usesUUIDDefaultID = (payload: Payload): boolean =>
  payload.db.idType === Schema.Types.UUID

/**
 * Casts a query value to the ID type of the related collection. Handles the adapter-wide
 * UUID `idType` in addition to the default ObjectId. Returns `undefined` when the value
 * can't be cast (so the caller can disregard it).
 */
const castRelationIDValue = ({
  payload,
  relationTo,
  val,
}: {
  payload: Payload
  relationTo: string
  val: unknown
}): unknown => {
  const customIDType = payload.collections[relationTo]?.customIDType

  if (!customIDType && usesUUIDDefaultID(payload)) {
    return isValidUUID(val) ? new Types.UUID(val as string) : undefined
  }

  if (!customIDType) {
    return Types.ObjectId.isValid(val as string) ? new Types.ObjectId(val as string) : undefined
  }

  return undefined
}

type SanitizeQueryValueArgs = {
  field: FlattenedField
  hasCustomID: boolean
  locale?: string
  operator: Operator
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
  if ('blocks' in field) {
    for (const _block of field.blocks) {
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

  const useUUIDForDefaultID = usesUUIDDefaultID(payload)

  // Disregard invalid _ids
  if (path === '_id') {
    if (typeof val === 'string' && val.split(',').length === 1) {
      if (!hasCustomID && useUUIDForDefaultID) {
        if (!isValidUUID(val)) {
          return { operator: formattedOperator, val: undefined }
        }

        if (['in', 'not_in'].includes(operator)) {
          formattedValue = createArrayFromCommaDelineated(formattedValue).map(
            (id) => new Types.UUID(id),
          )
        } else {
          formattedValue = new Types.UUID(val)
        }
      } else if (!hasCustomID) {
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
          if (!hasCustomID && useUUIDForDefaultID) {
            if (isValidUUID(inVal)) {
              formattedValues.push(new Types.UUID(inVal))
            }

            return formattedValues
          }

          if (!hasCustomID) {
            if (Types.ObjectId.isValid(inVal)) {
              formattedValues.push(new Types.ObjectId(inVal))

              return formattedValues
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
      const castValue = castRelationIDValue({
        payload,
        relationTo: formattedValue.relationTo,
        val: value,
      })

      if (castValue !== undefined) {
        formattedValue.value = castValue
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

        if (typeof relationTo === 'string') {
          const cast = castRelationIDValue({ payload, relationTo, val: inVal })
          if (cast !== undefined) {
            formattedValues.push(cast)
          }
          return formattedValues
        }

        if (
          Array.isArray(relationTo) &&
          relationTo.some((relationTo) => !!payload.collections[relationTo]?.customIDType)
        ) {
          if (Types.ObjectId.isValid(inVal.toString())) {
            formattedValues.push(new Types.ObjectId(inVal))
          } else {
            // Mixed polymorphic: the value may target a collection using the UUID default id.
            if (useUUIDForDefaultID && isValidUUID(inVal.toString())) {
              formattedValues.push(new Types.UUID(inVal.toString()))
            }
            formattedValues.push(inVal)
          }
          return formattedValues
        }

        if (useUUIDForDefaultID) {
          if (isValidUUID(inVal.toString())) {
            formattedValues.push(new Types.UUID(inVal.toString()))
          }
          return formattedValues
        }

        if (Types.ObjectId.isValid(inVal.toString())) {
          formattedValues.push(new Types.ObjectId(inVal))
        }

        return formattedValues
      }, [])
    }

    // Handle hasMany relationships with equals operator and array values
    // For array equality checking
    if (
      ['equals', 'not_equals'].includes(operator) &&
      Array.isArray(formattedValue) &&
      'hasMany' in field &&
      field.hasMany
    ) {
      if (typeof relationTo === 'string') {
        const customIDType = payload.collections[relationTo]?.customIDType

        // Convert array values to proper types (ObjectId, UUID, or custom ID type)
        formattedValue = formattedValue.map((v) => {
          if (customIDType === 'number') {
            const parsed = parseFloat(v)
            return Number.isNaN(parsed) ? v : parsed
          }
          if (!customIDType && useUUIDForDefaultID) {
            return isValidUUID(v) ? new Types.UUID(v) : v
          }
          if (!Types.ObjectId.isValid(v)) {
            return v
          }
          return new Types.ObjectId(v)
        })
      } else {
        // Polymorphic hasMany - convert array of {relationTo, value} objects
        formattedValue = formattedValue.map((item) => {
          if (typeof item === 'object' && 'value' in item) {
            const relTo = item.relationTo
            const customIDType = payload.collections[relTo]?.customIDType
            if (customIDType === 'number') {
              const parsed = parseFloat(item.value)
              return { relationTo: relTo, value: Number.isNaN(parsed) ? item.value : parsed }
            }
            const cast = castRelationIDValue({ payload, relationTo: relTo, val: item.value })
            if (cast !== undefined) {
              return { relationTo: relTo, value: cast }
            }
            return item
          }
          // Non-polymorphic format - just IDs
          if (useUUIDForDefaultID) {
            return isValidUUID(item) ? new Types.UUID(item) : item
          }
          if (Types.ObjectId.isValid(item)) {
            return new Types.ObjectId(item)
          }
          return item
        })
      }
    } else if (
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
        } else if (useUUIDForDefaultID) {
          if (!isValidUUID(formattedValue)) {
            return { operator: formattedOperator, val: undefined }
          }
          formattedValue = new Types.UUID(formattedValue)
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
            // The value may target a collection using the adapter-wide UUID default id.
            if (useUUIDForDefaultID && isValidUUID(val)) {
              formattedValue.push(new Types.UUID(val))
            }
          }
        } else if (useUUIDForDefaultID) {
          if (!isValidUUID(formattedValue)) {
            return { operator: formattedOperator, val: undefined }
          }
          formattedValue = new Types.UUID(formattedValue)
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
        if (useUUIDForDefaultID && isValidUUID(v)) {
          formattedValue[i] = new Types.UUID(v)
        } else if (Types.ObjectId.isValid(v)) {
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
      if ('hasMany' in field && field.hasMany && field.type === 'select') {
        // For hasMany select, "contains" means the array includes this exact value
        if (typeof formattedValue === 'string') {
          return {
            rawQuery: {
              [path]: formattedValue,
            },
          }
        } else if (Array.isArray(formattedValue)) {
          return {
            rawQuery: {
              $or: formattedValue.map((val) => ({
                [path]: val,
              })),
            },
          }
        }
      } else if ('hasMany' in field && field.hasMany && ['number', 'text'].includes(field.type)) {
        // For hasMany text/number, "contains" means substring matching within array elements
        if (typeof formattedValue === 'string') {
          // Search for documents where any array element contains this string
          const escapedValue = escapeRegExp(formattedValue)
          return {
            rawQuery: {
              [path]: {
                $elemMatch: {
                  $options: 'i',
                  $regex: escapedValue,
                },
              },
            },
          }
        } else if (Array.isArray(formattedValue)) {
          // Search for documents where any array element contains any of the search values
          return {
            rawQuery: {
              $or: formattedValue.map((val) => {
                const escapedValue = escapeRegExp(String(val))
                return {
                  [path]: {
                    $elemMatch: {
                      $options: 'i',
                      $regex: escapedValue,
                    },
                  },
                }
              }),
            },
          }
        }
      } else if (typeof formattedValue === 'string') {
        // Regular (non-hasMany) text field. Guard against non-string values (e.g. a UUID
        // Binary from a relationship id) which should match exactly, not via regex.
        formattedValue = {
          $options: 'i',
          $regex: escapeRegExp(formattedValue),
        }
      }
    }

    if (operator === 'exists') {
      formattedValue = formattedValue === 'true' || formattedValue === true

      let treatEmptyString = !['array', 'blocks', 'checkbox', 'relationship', 'upload'].includes(
        field.type,
      )

      if (field.type === 'text' && field.hasMany) {
        treatEmptyString = false
      } else if (field.type === 'number' && field.hasMany) {
        treatEmptyString = false
      } else if (field.type === 'select' && field.hasMany) {
        treatEmptyString = false
      }

      // _id can't be empty string, will error Cast to ObjectId failed for value ""
      return buildExistsQuery(formattedValue, path, treatEmptyString)
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
