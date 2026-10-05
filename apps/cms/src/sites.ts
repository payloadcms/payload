/**
 * The websites and apps that read content from this CMS. Each one asks only for its own content,
 * e.g. `GET /api/pages?where[sites][in]=business`.
 *
 * `value` is what the website or app sends, so keep it once a site is live. Change `label` freely.
 * To add a site, add a line here and restart the CMS.
 */
export const sites = [
  { label: 'Personal website', value: 'personal' },
  { label: 'Business website', value: 'business' },
  { label: 'iOS app', value: 'ios-app' },
] as const

export type Site = (typeof sites)[number]['value']
