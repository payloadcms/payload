import type { AuthorizedMCP } from '../types.js'

/**
 * Returns the `user` and `overrideAccess` arguments every Payload local API call
 * should receive when initiated from an MCP request. Spread the result into the
 * call's arg object so the two pieces of caller state can't drift apart.
 *
 * @example
 * ```ts
 * await req.payload.create({
 *   collection: 'posts',
 *   data,
 *   ...localAPIDefaults(authorizedMCP),
 * })
 * ```
 */
export const localAPIDefaults = (
  authorizedMCP: AuthorizedMCP,
): { overrideAccess: boolean; user: AuthorizedMCP['user'] } => ({
  overrideAccess: authorizedMCP.overrideAccess,
  user: authorizedMCP.user,
})
