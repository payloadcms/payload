import type { FieldState, FormState } from 'payload'

import ObjectIdImport from 'bson-objectid'

import type { ClipboardPasteData } from './types.js'

const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport

export function reduceFormStateByPath({
  formState,
  path,
  rowIndex,
}: {
  formState: FormState
  path: string
  rowIndex?: number
}) {
  const filteredState: Record<string, FieldState> = {}
  const prefix = typeof rowIndex !== 'number' ? path : `${path}.${rowIndex}`

  for (const key in formState) {
    if (!key.startsWith(prefix)) {
      continue
    }

    const { customComponents: _, validate: __, ...field } = formState[key]

    if (Array.isArray(field.rows)) {
      field.rows = field.rows.map((row) => {
        if (!row || typeof row !== 'object') {
          return row
        }
        const { customComponents: _, ...serializableRow } = row
        return serializableRow
      })
    }

    filteredState[key] = field
  }

  return filteredState
}

export function mergeFormStateFromClipboard({
  dataFromClipboard: clipboardData,
  formState,
  path,
  rowIndex,
}: {
  dataFromClipboard: ClipboardPasteData
  formState: FormState
  path: string
  rowIndex?: number
}) {
  const {
    type: typeFromClipboard,
    data: dataFromClipboard,
    path: pathFromClipboard,
    rowIndex: rowIndexFromClipboard,
  } = clipboardData

  const copyFromField = typeof rowIndexFromClipboard !== 'number'
  const pasteIntoField = typeof rowIndex !== 'number'
  const fromRowToField = !copyFromField && pasteIntoField
  const isArray = typeFromClipboard === 'array'

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
    const rowIDFromClipboard = dataFromClipboard[`${pathToReplace}.id`]?.value as string
    const hasRows = formState[path].rows?.length

    formState[path].rows = [
      {
        ...(hasRows && isArray ? formState[path].rows[0] : {}),
        id: rowIDFromClipboard,
        isLoading: false,
        lastRenderedPath,
      },
    ]
    formState[path].value = 1
    formState[path].initialValue = 1
    formState[path].disableFormData = true

    for (const fieldPath in formState) {
      if (
        fieldPath !== path &&
        !fieldPath.startsWith(lastRenderedPath) &&
        fieldPath.startsWith(path)
      ) {
        delete formState[fieldPath]
      }
    }
  }

  // Map to track old IDs to new IDs for regenerating nested IDs
  const idReplacements: Map<string, string> = new Map()

  for (const clipboardPath in dataFromClipboard) {
    // Pasting a row id, skip overwriting
    if (
      (!pasteIntoField && clipboardPath.endsWith('.id')) ||
      !clipboardPath.startsWith(pathToReplace)
    ) {
      continue
    }

    const newPath = clipboardPath.replace(pathToReplace, targetSegment)

    const customComponents = isArray ? formState[newPath]?.customComponents : undefined
    const validate = isArray ? formState[newPath]?.validate : undefined

    // If this is an ID field, generate a new ID to prevent duplicates
    if (clipboardPath.endsWith('.id') && dataFromClipboard[clipboardPath]?.value) {
      const oldID = dataFromClipboard[clipboardPath].value as string
      if (typeof oldID === 'string' && ObjectId.isValid(oldID)) {
        const newID = new ObjectId().toHexString()
        idReplacements.set(clipboardPath, newID)

        formState[newPath] = {
          customComponents,
          validate,
          ...dataFromClipboard[clipboardPath],
          initialValue: newID,
          value: newID,
        }
        continue
      }
    }

    formState[newPath] = {
      customComponents,
      validate,
      ...dataFromClipboard[clipboardPath],
    }
  }

  // Update parent field rows with new IDs
  for (const [clipboardPath, newID] of idReplacements) {
    const relativePath = clipboardPath.replace(`${pathToReplace}.`, '')
    const segments = relativePath.split('.')

    if (segments.length >= 2) {
      const rowIndex = parseInt(segments[segments.length - 2], 10)
      const parentFieldPath = segments.slice(0, segments.length - 2).join('.')
      const fullParentPath = parentFieldPath ? `${targetSegment}.${parentFieldPath}` : targetSegment

      if (formState[fullParentPath] && Array.isArray(formState[fullParentPath].rows)) {
        const parentRows = formState[fullParentPath].rows
        if (!isNaN(rowIndex) && parentRows[rowIndex]) {
          parentRows[rowIndex].id = newID
        }
      }
    } else if (segments.length === 1 && segments[0] === 'id') {
      // Top-level block ID - extract field path and row index from targetSegment
      const targetParts = targetSegment.split('.')
      const lastPart = targetParts[targetParts.length - 1]
      const rowIndexFromTarget = !isNaN(parseInt(lastPart, 10)) ? parseInt(lastPart, 10) : 0
      const fieldPath = !isNaN(parseInt(lastPart, 10))
        ? targetParts.slice(0, -1).join('.')
        : targetSegment

      if (formState[fieldPath] && Array.isArray(formState[fieldPath].rows)) {
        const rows = formState[fieldPath].rows
        if (rows[rowIndexFromTarget]) {
          rows[rowIndexFromTarget].id = newID
        }
      }
    }
  }

  return formState
}
