import type { Data, FormState } from 'payload'

import { reduceFieldsToValues } from 'payload/shared'

/** Reduces row-based form state without leaking array row counts into document data. */
export const reduceFormStateToData = ({
  formState = {},
  initialData,
}: {
  formState: FormState
  /** Original data preserves null arrays when their client fields initialize a zero row count. */
  initialData?: Data
}): Data => {
  const formStateWithoutRowCounts = Object.fromEntries(
    Object.entries(formState).map(([path, fieldState]) => {
      if (!fieldState || !Array.isArray(fieldState.rows)) {
        return [path, fieldState]
      }

      if (
        fieldState.value === undefined ||
        (fieldState.disableFormData !== false &&
          fieldState.isModified !== true &&
          fieldState.rows.length === 0 &&
          getValueAtPath(initialData, path) === null)
      ) {
        return [path, { ...fieldState, value: null }]
      }

      return [
        path,
        fieldState.value === null ? fieldState : { ...fieldState, disableFormData: true },
      ]
    }),
  )

  return normalizeData({
    data: reduceFieldsToValues(formStateWithoutRowCounts, true),
    rowFieldPaths: new Set(),
  })
}

const getValueAtPath = (data: Data | undefined, path: string): unknown =>
  path.split('.').reduce<unknown>((value, pathSegment) => {
    if (!value || typeof value !== 'object') {
      return undefined
    }

    return (value as Record<string, unknown>)[pathSegment]
  }, data)

const normalizeData = ({
  data,
  parentPath = '',
  rowFieldPaths,
}: {
  data: Data
  parentPath?: string
  rowFieldPaths: Set<string>
}): Data => {
  const normalizedData: Data = {}

  for (const [key, value] of Object.entries(data)) {
    const path = parentPath ? `${parentPath}.${key}` : key
    const normalizedValue = normalizeValue({ parentPath: path, rowFieldPaths, value })

    if (normalizedValue !== undefined) {
      normalizedData[key] = normalizedValue
    }
  }

  return normalizedData
}

const normalizeValue = ({
  parentPath,
  rowFieldPaths,
  value,
}: {
  parentPath: string
  rowFieldPaths: Set<string>
  value: unknown
}): unknown => {
  if (
    value === undefined ||
    (Array.isArray(value) && value.length === 0 && rowFieldPaths.has(parentPath))
  ) {
    return undefined
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      item && typeof item === 'object' && !Array.isArray(item)
        ? normalizeData({
            data: item as Data,
            parentPath: `${parentPath}.${index}`,
            rowFieldPaths,
          })
        : item,
    )
  }

  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return normalizeData({ data: value, parentPath, rowFieldPaths })
  }

  return value
}
