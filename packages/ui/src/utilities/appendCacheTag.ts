/**
 * Appends a cache-busting tag to a URL as a query parameter.
 * If the URL already has a query string, the tag is appended with `&`, otherwise with `?`.
 * Blob URLs identify local objects exactly, so they cannot be cache-busted.
 */
export function appendCacheTag(url: string, cacheTag: false | string | undefined): string {
  if (!cacheTag || url.startsWith('blob:')) {
    return url
  }
  const queryChar = url.includes('?') ? '&' : '?'
  return `${url}${queryChar}${encodeURIComponent(cacheTag)}`
}
