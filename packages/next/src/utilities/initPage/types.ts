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
   * If `useLayoutReq`, this page will use the `req` created by the root layout.
   * This is useful for pages that share the same `req` as the root layout, as permissions
   * do not need to be re-fetched.
   *
   * If you need the query and url properties of the `req` object to be updated, or if you
   * need permissions calculation to respect the current locale or url, you should not use this.
   */
  useLayoutReq?: boolean
}
