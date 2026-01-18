import { isClipboardDataValid } from './isClipboardDataValid.js';
const localStorageClipboardKey = '_payloadClipboard';
/**
 * @note This function doesn't use the Clipboard API, but localStorage. See rationale in #11513
 */
export function clipboardCopy(args) {
  const {
    getDataToCopy,
    t,
    ...rest
  } = args;
  const dataToWrite = {
    data: getDataToCopy(),
    ...rest
  };
  try {
    localStorage.setItem(localStorageClipboardKey, JSON.stringify(dataToWrite));
    return true;
  } catch (_err) {
    return t('error:unableToCopy');
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
}) {
  let dataToPaste;
  try {
    const jsonFromClipboard = localStorage.getItem(localStorageClipboardKey);
    if (!jsonFromClipboard) {
      return t('error:invalidClipboardData');
    }
    dataToPaste = JSON.parse(jsonFromClipboard);
  } catch (_err) {
    return t('error:invalidClipboardData');
  }
  const dataToValidate = {
    ...dataToPaste,
    ...args,
    fieldPath
  };
  if (!isClipboardDataValid(dataToValidate)) {
    return t('error:invalidClipboardData');
  }
  onPaste(dataToPaste);
  return true;
}
//# sourceMappingURL=clipboardUtilities.js.map