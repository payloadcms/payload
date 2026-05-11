import type { CollectionConfig } from 'payload'

import type { MCPPluginConfig } from '../types.js'

/**
 * Slugs we never expose via MCP regardless of plugin config — the API keys
 * collection itself is excluded for security (exposing it over MCP would let any
 * MCP client mint or read credentials).
 */
const HARD_EXCLUDED_SLUGS = new Set(['payload-mcp-api-keys'])

type EntityConfigEntry = {
  disabled?: boolean | Record<string, boolean | undefined>
}

/**
 * Returns whether a specific operation on a collection / global is disabled in
 * the plugin config. Treats `undefined` and `false` as "not disabled" (allowed).
 */
export const isOperationDisabled = (
  config: Partial<Record<string, EntityConfigEntry>> | undefined,
  slug: string,
  operation: string,
): boolean => {
  const entry = config?.[slug]
  if (!entry) {
    return false
  }
  if (entry.disabled === true) {
    return true
  }
  if (entry.disabled && typeof entry.disabled === 'object') {
    return entry.disabled[operation] === true
  }
  return false
}

/**
 * Returns the slugs of every Payload collection that should be exposed via MCP:
 * everything except the API keys collection and any explicitly fully-disabled
 * collections in the plugin config.
 */
export const getEnabledCollectionSlugs = (
  payloadCollections: CollectionConfig[] | undefined,
  pluginCollections: MCPPluginConfig['collections'],
): string[] =>
  (payloadCollections ?? [])
    .map((c) => c.slug)
    .filter(
      (slug) => !HARD_EXCLUDED_SLUGS.has(slug) && pluginCollections?.[slug]?.disabled !== true,
    )

/**
 * Returns the slugs of every Payload global that should be exposed via MCP.
 */
export const getEnabledGlobalSlugs = (
  payloadGlobals: { slug: string }[] | undefined,
  pluginGlobals: MCPPluginConfig['globals'],
): string[] =>
  (payloadGlobals ?? [])
    .map((g) => g.slug)
    .filter((slug) => pluginGlobals?.[slug]?.disabled !== true)
