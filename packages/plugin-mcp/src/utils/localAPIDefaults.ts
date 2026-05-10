import type { MCPAccess } from '../types.js'

/**
 * Returns the `user` and `overrideAccess` arguments every Payload local API call
 * should receive when initiated from an MCP request. Spread the result into the
 * call's arg object — keeps the two pieces of MCP-derived state co-located so
 * callers can't forget one and end up running a request with stale defaults.
 *
 * @example
 * ```ts
 * await req.payload.create({
 *   collection: 'posts',
 *   data,
 *   ...localAPIDefaults(mcpAccess),
 * })
 * ```
 */
export const localAPIDefaults = (
  mcpAccess: MCPAccess,
): { overrideAccess: boolean; user: MCPAccess['user'] } => ({
  overrideAccess: mcpAccess.overrideAccess,
  user: mcpAccess.user,
})
