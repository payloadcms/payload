/**
 * Whether the request is a browser navigation (link click, redirect, form submission) that
 * started on another site. Such a request can only be authenticated by ambient credentials like
 * the session cookie, since a navigation cannot set custom headers such as `Authorization`.
 */
export const isCrossSiteNavigation = (headers: Headers): boolean => {
  return (
    headers.get('Sec-Fetch-Site') === 'cross-site' && headers.get('Sec-Fetch-Mode') === 'navigate'
  )
}
