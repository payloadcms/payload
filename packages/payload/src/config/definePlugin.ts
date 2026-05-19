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
 * The `plugin` function receives a single object containing `config`, `plugins`
 * (a slug-keyed map of other plugins), and any user-provided options spread in.
 *
 * @experimental
 *
 * @example
 * // With options:
 * export const seoPlugin = definePlugin<SEOPluginOptions>({
 *   slug: 'plugin-seo',
 *   order: 10,
 *   plugin: ({ config, plugins, collections }) => ({ ...config }),
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
  slug?: string
}): () => Plugin
export function definePlugin<TOptions extends Record<string, unknown>>(descriptor: {
  order?: number
  plugin: (args: { config: Config; plugins: PluginsMap } & TOptions) => Config | Promise<Config>
  slug?: string
}): (options: TOptions) => Plugin
export function definePlugin<TOptions extends Record<string, unknown>>(descriptor: {
  order?: number
  plugin: (args: { config: Config; plugins: PluginsMap } & TOptions) => Config | Promise<Config>
  slug?: string
}): (options?: TOptions) => Plugin {
  return (options?: TOptions): Plugin => {
    const pluginFn: Plugin = (config) => {
      const plugins = buildPluginsMap(config.plugins)

      const args = {
        ...options,
        config,
        plugins,
      } as { config: Config; plugins: PluginsMap } & TOptions

      return descriptor.plugin(args)
    }

    pluginFn.options = options as Record<string, unknown>

    if (descriptor.slug !== undefined) {
      pluginFn.slug = descriptor.slug
    }
    if (descriptor.order !== undefined) {
      pluginFn.order = descriptor.order
    }

    return pluginFn
  }
}
