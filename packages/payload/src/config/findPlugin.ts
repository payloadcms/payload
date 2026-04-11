import type { RegisteredPlugins } from '../index.js'
import type { Plugin } from './types.js'

/**
 * Finds a plugin by slug with typed options when the slug is registered
 * via `RegisteredPlugins` module augmentation.
 *
 * For registered slugs, `options` is automatically typed — no cast needed.
 * For unknown slugs, returns a base `Plugin`.
 *
 * @example
 * // plugin-seo augments RegisteredPlugins — options is typed as SEOPluginOptions
 * const seo = findPlugin(config.plugins, 'plugin-seo')
 * seo?.options?.collections.push('my-collection')
 */
export function findPlugin<TSlug extends keyof RegisteredPlugins>(
  plugins: Plugin[] | undefined,
  slug: TSlug,
): ({ options: RegisteredPlugins[TSlug] } & Plugin) | undefined
export function findPlugin(plugins: Plugin[] | undefined, slug: string): Plugin | undefined
export function findPlugin(plugins: Plugin[] | undefined, slug: string): Plugin | undefined {
  return plugins?.find((p) => p.slug === slug)
}
