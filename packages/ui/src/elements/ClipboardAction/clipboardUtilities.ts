import type {
  ClipboardCopyActionArgs,
  ClipboardPasteActionArgs,
  ClipboardPasteActionValidateArgs,
  ClipboardPasteData,
} from './types.js'

import { isClipboardDataValid } from './isClipboardDataValid.js'

const localStorageClipboardKey = '_payloadClipboard'

export function clipboardCopy(args: ClipboardCopyActionArgs): string | true {
  const { getDataToCopy, t, ...rest } = args

  const dataToWrite = {
    data: getDataToCopy(),
    ...rest,
  }

  try {
    localStorage.setItem(localStorageClipboardKey, JSON.stringify(dataToWrite))
    return true
  } catch (_err) {
    return t('error:unableToCopy')
  }
}

export function clipboardPaste({
  onPaste,
  path: fieldPath,
  t,
  ...args
}: ClipboardPasteActionArgs): string | true {
  let dataToPaste: ClipboardPasteData

  try {
    const jsonFromClipboard = localStorage.getItem(localStorageClipboardKey)

    if (!jsonFromClipboard) {
      return t('error:invalidClipboardData')
    }

    dataToPaste = JSON.parse(jsonFromClipboard)
  } catch (_err) {
    return t('error:invalidClipboardData')
  }

  const dataToValidate = {
    ...dataToPaste,
    ...args,
    fieldPath,
  } as ClipboardPasteActionValidateArgs

  if (!isClipboardDataValid(dataToValidate)) {
    return t('error:invalidClipboardData')
  }

  onPaste(dataToPaste)

  return true
}
