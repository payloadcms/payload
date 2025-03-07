import type { FormState, JsonObject } from 'payload'

import ObjectIdImport from 'bson-objectid'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

export function getFormStateFromClipboardRows({
  dataFromClipboard,
  formState: oldState,
  path,
}: {
  dataFromClipboard: JsonObject | JsonObject[]
  formState: FormState
  path: string
}) {
  const pasteData = Array.isArray(dataFromClipboard) ? dataFromClipboard : [dataFromClipboard]
  const hasExtraRows = pasteData.length < oldState[path].rows?.length
  const newState = hasExtraRows ? {} : oldState

  if (hasExtraRows) {
    for (const key in oldState) {
      if (!key.startsWith(path)) {
        newState[key] = oldState[key]
      }
    }
  }

  const rows = pasteData.map(() => ({ id: new ObjectId().toHexString() }))

  newState[path] = {
    disableFormData: true,
    initialValue: pasteData.length,
    requiresRender: true,
    rows,
    valid: true,
    value: pasteData.length,
  }

  for (let i = 0; i < pasteData.length; i++) {
    const rowId = rows[i].id
    const subFieldState = getSubFieldStateFromClipboardRow({
      dataFromClipboard: pasteData[i],
      rowId,
    })

    for (const key in subFieldState) {
      newState[`${path}.${i}.${key}`] = subFieldState[key]
    }
  }

  return newState
}

export function getSubFieldStateFromClipboardRow({
  dataFromClipboard,
  rowId,
}: {
  dataFromClipboard: JsonObject | JsonObject[]
  rowId: string
}) {
  const pasteData = Array.isArray(dataFromClipboard) ? dataFromClipboard[0] : dataFromClipboard
  const subFieldState: FormState = {}

  for (const key in pasteData) {
    const subFieldValue = key === 'id' ? rowId : pasteData[key]
    subFieldState[key] = {
      initialValue: subFieldValue,
      valid: true,
      value: subFieldValue,
    }
  }

  return subFieldState
}
