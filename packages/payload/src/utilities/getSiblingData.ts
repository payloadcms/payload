// @ts-strict-ignore
import type { Data, FormState } from '../admin/types.js'

import { reduceFieldsToValues } from './reduceFieldsToValues.js'
import { unflatten } from './unflatten.js'

export const getSiblingData = (fields: FormState, path: string): Data => {
  if (!fields) {
    return null
  }

  if (path.indexOf('.') === -1) {
    return reduceFieldsToValues(fields, true)
  }

  const siblingFields = {}

  // Determine if the last segment of the path is an array-based row
  const pathSegments = path.split('.')
  const lastSegment = pathSegments[pathSegments.length - 1]
  const lastSegmentIsRowIndex = !Number.isNaN(Number(lastSegment))

  let parentFieldPath: string

  if (lastSegmentIsRowIndex) {
    // If the last segment is a row index,
    // the sibling data is that row's contents
    // so create a parent field path that will
    // retrieve all contents of that row index only
    parentFieldPath = `${path}.`
  } else {
    // Otherwise, the last path segment is a field name
    // and it should be removed
    parentFieldPath = path.substring(0, path.lastIndexOf('.') + 1)
  }

  Object.keys(fields).forEach((fieldKey) => {
    if (!fields[fieldKey].disableFormData && fieldKey.indexOf(parentFieldPath) === 0) {
      siblingFields[fieldKey.replace(parentFieldPath, '')] = fields[fieldKey].value
    }
  })

  return unflatten(siblingFields)
}
