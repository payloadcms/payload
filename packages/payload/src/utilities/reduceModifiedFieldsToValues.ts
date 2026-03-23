import type { Data, FormState } from '../admin/types.js'

import { reduceFieldsToValues } from './reduceFieldsToValues.js'
import { unflatten as flatleyUnflatten } from './unflatten.js'

/**
 * Like `reduceFieldsToValues`, but only includes fields whose `value` differs from their `initialValue`.
 *
 * For flattened paths that represent nested structures (e.g. `group.title`), the top-level key
 * is always included when any child within it has changed, so the server receives a complete
 * sub-object for each modified branch and doesn't overwrite unmodified groups with `{}`.
 *
 * When every top-level branch has at least one change, the result is identical to a full save.
 * In that case we delegate to `reduceFieldsToValues` so we avoid comparing every remaining path
 * under an already-dirty top-level key and avoid building the same payload twice.
 *
 * Note: For typical “small edit” saves this still does more CPU work than `reduceFieldsToValues`
 * because it must prove unchanged branches match `initialValue` (often via deep equality). The
 * benefit is a smaller request body and less server merge work—not a faster client reducer.
 */
export const reduceModifiedFieldsToValues = (fields: FormState, unflatten?: boolean): Data => {
  if (!fields) {
    return {}
  }

  const paths = Object.keys(fields)
  const eligiblePaths: string[] = []
  const allTopLevelKeys = new Set<string>()

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i] as string
    const field = fields[path]

    if (field?.disableFormData) {
      continue
    }

    eligiblePaths.push(path)
    allTopLevelKeys.add(path.split('.')[0] as string)
  }

  const modifiedTopLevelKeys = new Set<string>()

  for (let i = 0; i < eligiblePaths.length; i++) {
    const path = eligiblePaths[i] as string
    const field = fields[path] as NonNullable<FormState[string]>
    const topKey = path.split('.')[0] as string

    if (modifiedTopLevelKeys.has(topKey)) {
      continue
    }

    const value = field.value
    const initialValue = field.initialValue

    if (!isEqual(value, initialValue)) {
      modifiedTopLevelKeys.add(topKey)

      if (modifiedTopLevelKeys.size === allTopLevelKeys.size) {
        return reduceFieldsToValues(fields, unflatten)
      }
    }
  }

  if (modifiedTopLevelKeys.size === 0) {
    return {}
  }

  let data: Record<string, any> = {}

  for (let i = 0; i < eligiblePaths.length; i++) {
    const path = eligiblePaths[i] as string

    if (modifiedTopLevelKeys.has(path.split('.')[0] as string)) {
      data[path] = fields[path]?.value
    }
  }

  if (unflatten) {
    data = flatleyUnflatten(data)
  }

  return data
}

/**
 * Deep equality for comparing a field's `value` to `initialValue`.
 * `null` and `undefined` are treated as the same “empty” pair; otherwise both must be non-nullish
 * before values are compared recursively.
 */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  if (isNullUndefinedPair(a, b)) {
    return true
  }

  if (isNullish(a) || isNullish(b)) {
    return false
  }

  if (typeof a !== typeof b || typeof a !== 'object') {
    return false
  }

  const isArrayA = Array.isArray(a)
  const isArrayB = Array.isArray(b)

  if (isArrayA !== isArrayB) {
    return false
  }

  if (isArrayA) {
    return isEqualArray(a, b as unknown[])
  }

  return isEqualRecord(a as Record<string, unknown>, b as Record<string, unknown>)
}

function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

function isNullUndefinedPair(a: unknown, b: unknown): boolean {
  return (a === undefined && b === null) || (a === null && b === undefined)
}

function isEqualArray(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) {
    return false
  }

  return a.every((item, index) => isEqual(item, b[index]))
}

function isEqualRecord(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) {
    return false
  }

  return keysA.every((key) => isEqual(a[key], b[key]))
}
