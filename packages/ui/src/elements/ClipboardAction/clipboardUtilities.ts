import type {
  ClipboardCopyActionArgs,
  ClipboardPasteActionArgs,
  ClipboardPasteActionValidateArgs,
  ClipboardPasteData,
  ClipboardPasteEligibilityArgs,
} from './types.js'

import { isClipboardDataValid } from './isClipboardDataValid.js'

const localStorageClipboardKey = '_payloadClipboard'

/**
 * Reads and parses the clipboard data from localStorage.
 *
 * @note This function doesn't use the Clipboard API, but localStorage. See rationale in #11513
 */
function readClipboardData(): ClipboardPasteData | null {
  try {
    const jsonFromClipboard = localStorage.getItem(localStorageClipboardKey)

    if (!jsonFromClipboard) {
      return null
    }

    return JSON.parse(jsonFromClipboard)
  } catch (_err) {
    return null
  }
}

/**
 * Whether the clipboard contents can be pasted into the target field.
 *
 * Returns `false` when the clipboard is empty or its schema is incompatible
 * with the target. Used to disable paste actions when they would fail.
 */
export function canPasteClipboardData(args: ClipboardPasteEligibilityArgs): boolean {
  const dataToPaste = readClipboardData()

  if (!dataToPaste) {
    return false
  }

  const { path, ...schemaArgs } = args

  const dataToValidate = {
    ...dataToPaste,
    ...schemaArgs,
    fieldPath: path,
  } as ClipboardPasteActionValidateArgs

  return isClipboardDataValid(dataToValidate)
}

/**
 * @note This function doesn't use the Clipboard API, but localStorage. See rationale in #11513
 */
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

/**
 * @note This function doesn't use the Clipboard API, but localStorage. See rationale in #11513
 */
export function clipboardPaste({
  onPaste,
  path: fieldPath,
  t,
  ...args
}: ClipboardPasteActionArgs): string | true {
  const dataToPaste = readClipboardData()

  if (!dataToPaste) {
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
