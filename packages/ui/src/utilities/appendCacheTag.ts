/**
 * Appends a cache-busting tag to a URL as a query parameter.
 * If the URL already has a query string, the tag is appended with `&`, otherwise with `?`.
 */
export function appendCacheTag(url: string, cacheTag: false | string | undefined): string {
  if (!cacheTag) {
    return url
  }
  const queryChar = url.includes('?') ? '&' : '?'
  return `${url}${queryChar}${encodeURIComponent(cacheTag)}`
}
