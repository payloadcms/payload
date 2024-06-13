import type { SanitizedConfig } from 'payload'

export type Args = {
  /**
   * Your sanitized Payload config.
   * If unresolved, this function will await the promise.
   */
  config: Promise<SanitizedConfig> | SanitizedConfig
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
}
