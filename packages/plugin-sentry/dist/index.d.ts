import type { Config } from 'payload';
import type { PluginOptions } from './types.js';
export { PluginOptions };
/**
 * @example
 * ```ts
 * import * as Sentry from '@sentry/nextjs'
 *
 * sentryPlugin({
 *   options: {
 *     captureErrors: [400, 403],
 *     context: ({ defaultContext, req }) => {
 *       return {
 *         ...defaultContext,
 *         tags: {
 *           locale: req.locale,
 *         },
 *       }
 *     },
 *     debug: true,
 *   },
 *   Sentry,
 * })
 * ```
 */
export declare const sentryPlugin: (pluginOptions: PluginOptions) => (config: Config) => Config;
//# sourceMappingURL=index.d.ts.map