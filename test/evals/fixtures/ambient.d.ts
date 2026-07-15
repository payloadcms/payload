/**
 * Wildcard module declarations for path aliases that LLMs commonly use in
 * generated configs (e.g. `@/components/Logo`). These don't need to resolve
 * to real files for our purposes — we only care that the config type-checks
 * structurally, not that the imported component exists.
 */
declare module '@/*'
declare module '~/*'
