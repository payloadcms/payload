import type { Data, FormState } from '../admin/types.js'

import { unflatten as flatleyUnflatten } from './unflatten.js'

/**
 * Like `reduceFieldsToValues`, but only includes fields whose `value` differs from their `initialValue`.
 *
 * For flattened paths that represent nested structures (e.g. `group.title`), the top-level key
 * is always included when any child within it has changed, so the server receives a complete
 * sub-object for each modified branch and doesn't overwrite unmodified groups with `{}`.
 */
export const reduceModifiedFieldsToValues = (fields: FormState, unflatten?: boolean): Data => {
  if (!fields) {
    return {}
  }

  const modifiedTopLevelKeys = new Set<string>()

  for (const path of Object.keys(fields)) {
    const field = fields[path]

    if (field?.disableFormData) {
      continue
    }

    const value = field?.value
    const initialValue = field?.initialValue

    if (!isEqual(value, initialValue)) {
      const topKey = path.split('.')[0] as string
      modifiedTopLevelKeys.add(topKey)
    }
  }

  if (modifiedTopLevelKeys.size === 0) {
    return {}
  }

  let data: Record<string, any> = {}

  for (const path of Object.keys(fields)) {
    const field = fields[path]

    if (field?.disableFormData) {
      continue
    }

    const topKey = path.split('.')[0] as string

    if (modifiedTopLevelKeys.has(topKey)) {
      data[path] = field?.value
    }
  }

  if (unflatten) {
    data = flatleyUnflatten(data)
  }

  return data
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  if (a === undefined && b === null) {
    return true
  }
  if (a === null && b === undefined) {
    return true
  }

  if (a === undefined || a === null || b === undefined || b === null) {
    return false
  }

  if (typeof a !== typeof b) {
    return false
  }

  if (typeof a !== 'object') {
    return false
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false
  }

  if (Array.isArray(a)) {
    if (a.length !== (b as unknown[]).length) {
      return false
    }
    return a.every((item, i) => isEqual(item, (b as unknown[])[i]))
  }

  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)

  if (aKeys.length !== bKeys.length) {
    return false
  }

  return aKeys.every((key) => isEqual(aObj[key], bObj[key]))
}
