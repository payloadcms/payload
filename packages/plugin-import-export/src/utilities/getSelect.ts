import type { SelectIncludeType } from 'payload'

import { APIError } from 'payload'

import { hasUnsupportedFieldPathSegment } from './fieldPath.js'

const createSelect = (): SelectIncludeType => Object.create(null) as SelectIncludeType

/**
 * Takes an input of array of string paths in dot notation and returns a select object.
 * Used for both export and import to build Payload's select query format.
 *
 * @example
 * getSelect(['id', 'title', 'group.value', 'createdAt', 'updatedAt'])
 * // Returns: { id: true, title: true, group: { value: true }, createdAt: true, updatedAt: true }
 */
export const getSelect = (fields: string[]): SelectIncludeType => {
  const select = createSelect()

  fields.forEach((field) => {
    const segments = field.split('.')

    if (hasUnsupportedFieldPathSegment(segments)) {
      throw new APIError('Invalid field path.', 400, null, true)
    }

    let selectRef = select

    segments.forEach((segment, i) => {
      if (i === segments.length - 1) {
        selectRef[segment] = true
      } else {
        if (!Object.prototype.hasOwnProperty.call(selectRef, segment)) {
          selectRef[segment] = createSelect()
        }
        selectRef = selectRef[segment] as SelectIncludeType
      }
    })
  })

  return select
}
