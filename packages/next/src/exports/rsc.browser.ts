/**
 * Browser-condition stub for `@payloadcms/next/rsc`.
 *
 * Bundlers serving the client graph load this file via the `"browser"` export
 * condition in `package.json`. The real implementations rely on server-only
 * APIs (`payload`, `child_process`, etc.) and must never be evaluated in a
 * browser context. These no-op components ensure that any stray client-side
 * import resolves successfully but renders nothing.
 */

export const DocumentHeader = () => null
export const HierarchyTypeFieldServer = () => null
export const Logo = () => null
export const DefaultNav = () => null
export const CollectionCards = () => null
