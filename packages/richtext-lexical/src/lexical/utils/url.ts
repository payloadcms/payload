export function sanitizeUrl(url: string): string {
  /** A pattern that matches safe  URLs. */
  const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file|sms):|[^&:/?#]*(?:[/?#]|$))/gi

  /** A pattern that matches safe data URLs. */
  const DATA_URL_PATTERN =
    /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z\d+/]+=*$/i

  url = String(url).trim()

  if (url.match(SAFE_URL_PATTERN) != null || url.match(DATA_URL_PATTERN) != null) {
    return url
  }

  return 'https://'
}

/**
 * This regex checks for absolute URLs in a string. Tested for the following use cases:
 * - http://example.com
 * - https://example.com
 * - ftp://files.example.com
 * - http://example.com/resource
 * - https://example.com/resource?key=value
 * - http://example.com/resource#anchor
 * - http://www.example.com
 * - https://sub.example.com/path/file
 * - mailto:
 */
export const absoluteRegExp =
  /^(?:[a-zA-Z][a-zA-Z\d+.-]*:(?:\/\/)?(?:[-;:&=+$,\w]+@)?[A-Za-z\d]+(?:\.[A-Za-z\d]+)+|www\.[A-Za-z\d]+(?:\.[A-Za-z\d]+)+|(?:tel|mailto):[\w+.-]+)(?:\/[+~%/\w-]*)?(?:\?[-;&=%\w]*)?(?:#\w+)?$/

/**
 * This regex checks for relative URLs starting with / or anchor links starting with # in a string. Tested for the following use cases:
 * - /privacy-policy
 * - /privacy-policy#primary-terms
 * - #primary-terms
 *  */
export const relativeOrAnchorRegExp = /^(?:\/[\w\-./]*(?:#\w[\w-]*)?|#[\w\-]+)$/

/**
 * Prevents unreasonable URLs from being inserted into the editor.
 * @param url
 */
export function validateUrlMinimal(url: string): boolean {
  if (!url) {
    return false
  }

  return !url.includes(' ')
}

// Do not keep validateUrl function too loose. This is run when pasting in text, to determine if links are in that text and if it should create AutoLinkNodes.
// This is why we do not allow stuff like anchors here, as we don't want copied anchors to be turned into AutoLinkNodes.
export function validateUrl(url: string): boolean {
  // TODO Fix UI for link insertion; it should never default to an invalid URL such as https://.
  // Maybe show a dialog where they user can type the URL before inserting it.

  if (!url) {
    return false
  }

  if (url === 'https://') {
    return true
  }

  // This makes sure URLs starting with www. instead of https are valid too
  if (absoluteRegExp.test(url)) {
    return true
  }

  // Check relative or anchor links
  if (relativeOrAnchorRegExp.test(url)) {
    return true
  }

  // While this doesn't allow URLs starting with www (which is why we use the regex above), it does properly handle tel: URLs
  try {
    new URL(url)
    return true
  } catch {
    /* empty */
  }

  return false
}
