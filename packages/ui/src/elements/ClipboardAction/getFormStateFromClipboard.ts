import type { FieldState, FormState } from 'payload'

export function reduceFormStateByPath({
  formState,
  path,
  rowIndex,
}: {
  formState: FormState
  path: string
  rowIndex?: number
}) {
  const result: Record<string, FieldState> = {}

  for (const key in formState) {
    if (
      Object.hasOwn(formState, key) &&
      key.startsWith(typeof rowIndex !== 'number' ? path : `${path}.${rowIndex}`)
    ) {
      result[key] = { ...formState[key] }
      if (result[key] && 'customComponents' in result[key]) {
        delete result[key].customComponents
      }

      if (Array.isArray(result[key].rows)) {
        for (const row of result[key].rows) {
          if (row && typeof row === 'object' && 'customComponents' in row) {
            delete row.customComponents
          }
        }
      }
    }
  }

  return result
}

export function getFormStateFromClipboard({
  dataFromClipboard: clipboardData,
  formState,
  path,
  rowIndex,
}: {
  dataFromClipboard: {
    data: FormState
    path: string
    rowIndex?: number
  }
  formState: FormState
  path: string
  rowIndex?: number
}) {
  const {
    data: dataFromClipboard,
    path: pathFromClipboard,
    rowIndex: rowIndexFromClipboard,
  } = clipboardData

  const copyFromField = typeof rowIndexFromClipboard !== 'number'
  const pasteIntoField = typeof rowIndex !== 'number'
  const fromRowToField = !copyFromField && pasteIntoField

  let pathToReplace: string
  if (copyFromField && pasteIntoField) {
    pathToReplace = pathFromClipboard
  } else if (copyFromField) {
    pathToReplace = `${pathFromClipboard}.${rowIndex}`
  } else {
    pathToReplace = `${pathFromClipboard}.${rowIndexFromClipboard}`
  }

  let targetSegment: string
  if (!pasteIntoField) {
    targetSegment = `${path}.${rowIndex}`
  } else if (fromRowToField) {
    targetSegment = `${path}.0`
  } else {
    targetSegment = path
  }

  if (fromRowToField) {
    const lastRenderedPath = `${path}.0`
    const rowIDFromClipboard = dataFromClipboard[`${pathToReplace}.id`].value as string
    const rowID = formState[path].rows?.length
      ? (formState[`${lastRenderedPath}.id`].value as string)
      : rowIDFromClipboard

    formState[path].rows = [
      {
        id: rowID,
        isLoading: false,
        lastRenderedPath,
      },
    ]
    formState[path].value = 1
    formState[path].initialValue = 1
    formState[path].disableFormData = true

    const firstElementPathPrefix = `${path}.0`
    for (const fieldPath in formState) {
      if (
        fieldPath !== path &&
        !fieldPath.startsWith(firstElementPathPrefix) &&
        fieldPath.startsWith(path)
      ) {
        delete formState[fieldPath]
      }
    }
  }

  for (const fieldPath in dataFromClipboard) {
    // Pasting a row id, skip overwriting
    if ((!pasteIntoField && fieldPath.endsWith('.id')) || !fieldPath.startsWith(pathToReplace)) {
      continue
    }

    const newPath = fieldPath.replace(pathToReplace, targetSegment)

    formState[newPath] = {
      ...dataFromClipboard[fieldPath],
    }
  }

  return formState
}
