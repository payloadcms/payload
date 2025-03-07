import type {
  ClipboardCopyActionArgs,
  ClipboardPasteActionArgs,
  ClipboardPasteActionValidateArgs,
  ClipboardPasteData,
} from './types.js'

import { isClipboardDataValid } from './isClipboardDataValid.js'

export async function clipboardCopy(args: ClipboardCopyActionArgs): Promise<string | true> {
  const { getDataToCopy, t, ...rest } = args

  const dataToWrite = {
    data: getDataToCopy(),
    ...rest,
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(dataToWrite))
    return true
  } catch (_err) {
    return t('error:unableToCopy')
  }
}

export async function clipboardPaste({
  onPaste,
  path: fieldPath,
  t,
  ...args
}: ClipboardPasteActionArgs): Promise<string | true> {
  let dataToPaste: ClipboardPasteData

  try {
    const jsonFromClipboard = await navigator.clipboard.readText()
    dataToPaste = JSON.parse(jsonFromClipboard)
  } catch (_err) {
    if (_err instanceof DOMException && _err.name === 'NotAllowedError') {
      return t('error:insufficientClipboardPermissions')
    }
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
