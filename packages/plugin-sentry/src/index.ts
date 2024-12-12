import type { ScopeContext } from '@sentry/types'
import type { APIError, Config } from 'payload'

import type { PluginOptions } from './types.js'

export { PluginOptions }
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
export const sentryPlugin =
  (pluginOptions: PluginOptions) =>
  (config: Config): Config => {
    const { enabled = true, options = {}, Sentry } = pluginOptions

    if (!enabled || !Sentry) {
      return config
    }

    const { captureErrors = [], debug = false } = options

    return {
      ...config,
      admin: {
        ...config.admin,
        components: {
          ...config.admin?.components,
          providers: [
            ...(config.admin?.components?.providers ?? []),
            '@payloadcms/plugin-sentry/client#AdminErrorBoundary',
          ],
        },
      },
      hooks: {
        afterError: [
          ...(config.hooks?.afterError ?? []),
          async (args) => {
            const status = (args.error as APIError).status ?? 500
            if (status >= 500 || captureErrors.includes(status)) {
              let context: Partial<ScopeContext> = {
                extra: {
                  errorCollectionSlug: args.collection?.slug,
                },
                ...(args.req.user && {
                  user: {
                    id: args.req.user.id,
                    collection: args.req.user.collection,
                    email: args.req.user.email,
                    ip_address: args.req.headers?.get('X-Forwarded-For') ?? undefined,
                    username: args.req.user.username,
                  },
                }),
              }

              if (options?.context) {
                context = await options.context({
                  ...args,
                  defaultContext: context,
                })
              }

              const id = Sentry.captureException(args.error, context)

              if (debug) {
                args.req.payload.logger.info(
                  `Captured exception ${id} to Sentry, error msg: ${args.error.message}`,
                )
              }
            }
          },
        ],
      },
    }
  }
