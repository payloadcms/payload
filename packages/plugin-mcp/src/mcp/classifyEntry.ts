import type { CollectionTool, GlobalTool, MCPBuiltInToolOverride, Tool } from '../types.js'

/**
 * Classify what an entry in a tools map means. The discriminator is the value:
 * - `false` → explicit disable
 * - `true` → explicit enable (only meaningful for opt-in tools)
 * - object with `handler` → custom tool definition (its specific shape is
 *   resolved by the caller based on which scope they're walking)
 * - object without `handler` → built-in override (description / overrideResponse)
 *
 * Returning the tool as `Tool | CollectionTool | GlobalTool` keeps this helper
 * scope-agnostic — the caller narrows to the right variant when consuming the
 * result.
 */
export type ClassifiedEntry =
  | { kind: 'custom'; value: CollectionTool | GlobalTool | Tool }
  | { kind: 'disabled' }
  | { kind: 'enabled' }
  | { kind: 'override'; value: MCPBuiltInToolOverride }
  | { kind: 'unset' }

export const classifyEntry = (entry: unknown): ClassifiedEntry => {
  if (entry === undefined) {
    return { kind: 'unset' }
  }
  if (entry === false) {
    return { kind: 'disabled' }
  }
  if (entry === true) {
    return { kind: 'enabled' }
  }
  if (
    typeof entry === 'object' &&
    entry !== null &&
    'handler' in entry &&
    typeof entry.handler === 'function'
  ) {
    return { kind: 'custom', value: entry as CollectionTool | GlobalTool | Tool }
  }
  return { kind: 'override', value: entry as MCPBuiltInToolOverride }
}

/**
 * Returns the set of custom tool names in a tools map — everything whose value
 * has a `handler`.
 */
export const getCustomToolNames = (tools: Record<string, unknown> | undefined): string[] => {
  if (!tools) {
    return []
  }
  return Object.entries(tools)
    .filter(
      ([, value]) => classifyEntry(value).kind === 'custom',
    )
    .map(([name]) => name)
}
