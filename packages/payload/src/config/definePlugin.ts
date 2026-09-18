import type { Config, Plugin, PluginsMap } from './types.js'

function buildPluginsMap(plugins: Plugin[] | undefined): PluginsMap {
  const map: Record<string, Plugin | undefined> = {}
  if (plugins) {
    for (const p of plugins) {
      if (p.slug) {
        map[p.slug] = p
      }
    }
  }
  return map as PluginsMap
}

/**
 * Helper for authoring plugins with order, slug, and typed options.
 * Eliminates boilerplate and ensures metadata is always set consistently.
 *
 * The `plugin` function receives `config`, `plugins` (a slug-keyed map of other
 * plugins), and the user-provided `options`.
 *
 * @experimental
 *
 * @example
 * // With options:
 * export const seoPlugin = definePlugin<SEOPluginConfig>({
 *   slug: 'plugin-seo',
 *   plugin: ({ config, options }) => ({ ...config }),
 * })
 *
 * // Without options:
 * export const myPlugin = definePlugin({
 *   slug: 'my-plugin',
 *   plugin: ({ config }) => ({ ...config }),
 * })
 */
export function definePlugin(descriptor: {
  order?: number
  plugin: (args: { config: Config; plugins: PluginsMap }) => Config | Promise<Config>
  slug: string
}): () => Plugin
export function definePlugin<TOptions>(descriptor: {
  order?: number
  plugin: (args: {
    config: Config
    options: TOptions
    plugins: PluginsMap
  }) => Config | Promise<Config>
  slug: string
}): undefined extends TOptions ? (options?: TOptions) => Plugin : (options: TOptions) => Plugin
export function definePlugin<TOptions>(descriptor: {
  order?: number
  plugin: (args: {
    config: Config
    options: TOptions
    plugins: PluginsMap
  }) => Config | Promise<Config>
  slug: string
}): (options: TOptions) => Plugin {
  return (options?: TOptions): Plugin => {
    const pluginFn: Plugin = (config) =>
      descriptor.plugin({
        config,
        options: options as TOptions,
        plugins: buildPluginsMap(config.plugins),
      })

    if (options !== undefined) {
      pluginFn.options = options as Record<string, unknown>
    }
    pluginFn.slug = descriptor.slug
    if (descriptor.order !== undefined) {
      pluginFn.order = descriptor.order
    }

    return pluginFn
  }
}
