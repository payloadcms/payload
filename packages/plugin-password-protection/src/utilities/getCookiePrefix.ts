export default (cookiePrefix: string, collectionSlug: string): string =>
  `${cookiePrefix}-${collectionSlug}-password-`
