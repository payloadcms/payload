import type { Config, Plugin } from './types.js'

/**
 * Helper for authoring plugins with order, slug, and typed options.
 * Eliminates boilerplate and ensures metadata is always set consistently.
 *
 * @example
 * // With options:
 * export const seoPlugin = definePlugin<SEOPluginOptions>({
 *   slug: 'plugin-seo',
 *   order: 10,
 *   plugin: (opts) => (config) => ({ ...config }),
 * })
 *
 * // Without options:
 * export const myPlugin = definePlugin({
 *   slug: 'my-plugin',
 *   plugin: () => (config) => ({ ...config }),
 * })
 */
export function definePlugin(descriptor: {
  order?: number
  plugin: () => (config: Config) => Config | Promise<Config>
  slug?: string
}): () => Plugin
export function definePlugin<TOptions>(descriptor: {
  order?: number
  plugin: (options: TOptions) => (config: Config) => Config | Promise<Config>
  slug?: string
}): (options: TOptions) => Plugin
export function definePlugin<TOptions>(descriptor: {
  order?: number
  plugin: (options?: TOptions) => (config: Config) => Config | Promise<Config>
  slug?: string
}): (options?: TOptions) => Plugin {
  return (options?: TOptions): Plugin => {
    const apply = descriptor.plugin(options)
    const pluginFn: Plugin = (config) => apply(config)
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
