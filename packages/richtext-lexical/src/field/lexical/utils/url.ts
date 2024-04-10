export function sanitizeUrl(url: string): string {
  /** A pattern that matches safe  URLs. */
  const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file|sms):|[^&:/?#]*(?:[/?#]|$))/gi

  /** A pattern that matches safe data URLs. */
  const DATA_URL_PATTERN =
    /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z\d+/]+=*$/i

  url = String(url).trim()

  if (url.match(SAFE_URL_PATTERN) != null || url.match(DATA_URL_PATTERN) != null) return url

  return 'https://'
}

// Source: https://stackoverflow.com/a/8234912/2013580
const urlRegExp =
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z\d.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z\d.-]+)((?:\/[+~%/.\w-]*)?\??[-+=&;%@.\w]*#?\w*)?)/

// Do not keep validateUrl function too loose. This is run when pasting in text, to determine if links are in that text and if it should create AutoLinkNodes.
// This is why we do not allow stuff like anchors here, as we don't want copied anchors to be turned into AutoLinkNodes.
export function validateUrl(url: string): boolean {
  // TODO Fix UI for link insertion; it should never default to an invalid URL such as https://.
  // Maybe show a dialog where they user can type the URL before inserting it.

  if (url === 'https://') return true

  // This makes sure URLs starting with www. instead of https are valid too
  if (urlRegExp.test(url)) return true

  // While this doesn't allow URLs starting with www (which is why we use the regex above), it does properly handle tel: URLs
  try {
    new URL(url)
    return true
  } catch {
    /* empty */
  }

  return false
}
