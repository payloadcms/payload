import type { ImportMap, SanitizedConfig } from 'payload'

export type Args = {
  /**
   * Your sanitized Payload config.
   * If unresolved, this function will await the promise.
   */
  config: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  /**
   * If true, redirects unauthenticated users to the admin login page.
   * If a string is provided, the user will be redirected to that specific URL.
   */
  redirectUnauthenticatedUser?: boolean | string
  /**
   * The current route, i.e. `/admin/collections/posts`.
   */
  route: string
  /**
   * The search parameters of the current route provided to all pages in Next.js.
   */
  searchParams: { [key: string]: string | string[] | undefined }
  /**
   * If `useLayoutReq` is `true`, this page will use the cached `req` created by the root layout
   * instead of creating a new one.
   *
   * This improves performance for pages that are able to share the same `req` as the root layout,
   * as permissions do not need to be re-calculated.
   *
   * If the page has unique query and url params that need to be part of the `req` object, or if you
   * need permissions calculation to respect those you should not use this property.
   */
  useLayoutReq?: boolean
}
