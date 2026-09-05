import type { Data, FormState } from 'payload'

import { dequal } from 'dequal/lite'

export const getCachedFormStateIfDataMatches = ({
  cachedFormState,
  formData,
}: {
  cachedFormState: FormState
  formData: Data
}): false | FormState => {
  if (!hasMatchingRowTopology({ cachedFormState, formData })) {
    return false
  }

  let reconciledFormState = cachedFormState

  for (const [path, fieldState] of Object.entries(cachedFormState)) {
    if (
      !fieldState ||
      path === 'blockName' ||
      path === 'blockType' ||
      Array.isArray(fieldState.rows)
    ) {
      continue
    }

    const currentValue = getCurrentValue({ formData, path })

    if (!currentValue.shouldUpdate) {
      continue
    }

    if (
      dequal(fieldState.value, currentValue.value) &&
      dequal(fieldState.initialValue, currentValue.value)
    ) {
      continue
    }

    if (reconciledFormState === cachedFormState) {
      reconciledFormState = { ...cachedFormState }
    }

    reconciledFormState[path] = {
      ...fieldState,
      initialValue: currentValue.value,
      value: currentValue.value,
    }
  }

  return reconciledFormState
}

/**
 * Cached field metadata can be reused while values change, but cached array and block rows cannot
 * describe a different row structure. In that case the caller must rebuild from the schema.
 */
const hasMatchingRowTopology = ({
  cachedFormState,
  formData,
}: {
  cachedFormState: FormState
  formData: Data
}): boolean => {
  for (const [path, fieldState] of Object.entries(cachedFormState)) {
    if (!fieldState || !Array.isArray(fieldState.rows)) {
      continue
    }

    const currentValue = getCurrentValue({ formData, path })

    if (!currentValue.shouldUpdate) {
      continue
    }

    if (currentValue.value === null) {
      if (fieldState.value !== null || fieldState.rows.length !== 0) {
        return false
      }
      continue
    }

    if (
      !Array.isArray(currentValue.value) ||
      fieldState.value === null ||
      currentValue.value.length !== fieldState.rows.length
    ) {
      return false
    }

    for (const [index, currentRow] of currentValue.value.entries()) {
      const cachedRow = fieldState.rows[index]

      if (!cachedRow || !currentRow || typeof currentRow !== 'object') {
        return false
      }

      const currentRowID = 'id' in currentRow ? currentRow.id : undefined

      if (currentRowID !== cachedRow.id) {
        return false
      }

      const currentBlockType = 'blockType' in currentRow ? currentRow.blockType : undefined

      if (currentBlockType !== cachedRow.blockType) {
        return false
      }
    }
  }

  return true
}

const getCurrentValue = ({
  formData,
  path,
}: {
  formData: Data
  path: string
}): { shouldUpdate: boolean; value?: unknown } => {
  const pathSegments = path.split('.')
  let currentValue: unknown = formData

  for (const [index, pathSegment] of pathSegments.entries()) {
    if (!currentValue || typeof currentValue !== 'object') {
      return {
        shouldUpdate: index > 0,
        value: undefined,
      }
    }

    const currentRecord = currentValue as Record<string, unknown>

    if (!(pathSegment in currentRecord)) {
      return {
        shouldUpdate: index > 0,
        value: undefined,
      }
    }

    currentValue = currentRecord[pathSegment]
  }

  return {
    shouldUpdate: true,
    value: currentValue,
  }
}
