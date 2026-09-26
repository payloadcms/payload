import type { Data, FormState } from 'payload'

import { dequal } from 'dequal/lite'
import { reduceFieldsToValues } from 'payload/shared'

export const getCachedFormStateIfDataMatches = ({
  cachedFormState,
  cachedSchemaPath,
  currentSchemaPath,
  formData,
}: {
  cachedFormState: FormState
  cachedSchemaPath?: string
  currentSchemaPath?: string
  formData: Data
}): false | FormState => {
  if (cachedSchemaPath !== currentSchemaPath) {
    return false
  }

  const cachedData = reduceFormStateToBlockData(cachedFormState)
  const currentData = normalizeData({
    data: formData,
    rowFieldPaths: getRowFieldPaths(cachedFormState),
  })

  return dequal(withoutSystemBlockFields(cachedData), withoutSystemBlockFields(currentData))
    ? cachedFormState
    : false
}

export const reduceFormStateToBlockData = (formState: FormState, currentData?: Data): Data => {
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
          getValueAtPath(currentData, path) === null)
      ) {
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

const getValueAtPath = (data: Data | undefined, path: string): unknown =>
  path.split('.').reduce<unknown>((value, pathSegment) => {
    if (!value || typeof value !== 'object') {
      return undefined
    }

    return (value as Record<string, unknown>)[pathSegment]
  }, data)

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
