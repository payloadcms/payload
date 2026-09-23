import type { Data, FormState } from 'payload'

import { dequal } from 'dequal/lite'
import { reduceFieldsToValues } from 'payload/shared'

export const getCachedFormStateIfDataMatches = ({
  cachedFormState,
  formData,
}: {
  cachedFormState: FormState
  formData: Data
}): false | FormState => {
  const cachedData = reduceFormStateToBlockData(cachedFormState)
  const currentData = normalizeData({
    data: formData,
    rowFieldPaths: getRowFieldPaths(cachedFormState),
  })

  return dequal(withoutSystemBlockFields(cachedData), withoutSystemBlockFields(currentData))
    ? cachedFormState
    : false
}

export const reduceFormStateToBlockData = (formState: FormState): Data => {
  const formStateWithoutRowCounts = Object.fromEntries(
    Object.entries(formState).map(([path, fieldState]) => {
      if (!fieldState || !Array.isArray(fieldState.rows)) {
        return [path, fieldState]
      }

      if (fieldState.value === undefined) {
        return [path, { ...fieldState, value: null }]
      }

      return [
        path,
        fieldState.value === null ? fieldState : { ...fieldState, disableFormData: true },
      ]
    }),
  ) as FormState

  return normalizeData({
    data: reduceFieldsToValues(formStateWithoutRowCounts, true),
    rowFieldPaths: new Set(),
  })
}

const getRowFieldPaths = (formState: FormState): Set<string> =>
  new Set(
    Object.entries(formState)
      .filter(
        ([, fieldState]) =>
          Array.isArray(fieldState?.rows) &&
          fieldState.value !== null &&
          fieldState.value !== undefined,
      )
      .map(([path]) => path),
  )

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
    return normalizeData({ data: value as Data, parentPath, rowFieldPaths })
  }

  return value
}

const withoutSystemBlockFields = ({
  blockName: _blockName,
  blockType: _blockType,
  ...data
}: Data): Data => data
