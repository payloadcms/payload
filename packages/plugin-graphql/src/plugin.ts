import type { Config } from 'payload'

import { definePlugin } from 'payload'

export type GraphQLPluginConfig = {
  /**
   * Override the route paths for the GraphQL endpoint and playground.
   * These map to `config.routes.graphQL` and `config.routes.graphQLPlayground`.
   */
  routes?: {
    /** @default '/graphql' */
    graphQL?: string
    /** @default '/graphql-playground' */
    graphQLPlayground?: string
  }
} & NonNullable<Config['graphQL']>

declare module 'payload' {
  interface RegisteredPlugins {
    '@payloadcms/plugin-graphql': GraphQLPluginConfig
  }
}

const DEFAULT_GRAPHQL_PATH = '/graphql'
const DEFAULT_PLAYGROUND_PATH = '/graphql-playground'

/**
 * Adds GraphQL support to Payload.
 *
 * Wraps the legacy `config.graphQL` and `config.routes.graphQL` /
 * `config.routes.graphQLPlayground` configuration into a plugin. Without this
 * plugin loaded, GraphQL endpoints are not registered and no GraphQL schema is
 * built — non-GraphQL projects don't pay the cost of `graphql`, `graphql-http`,
 * or `graphql-playground-html`.
 *
 * @example
 * ```ts
 * import { graphQLPlugin } from '@payloadcms/plugin-graphql'
 *
 * export default buildConfig({
 *   plugins: [
 *     graphQLPlugin({
 *       maxComplexity: 1000,
 *     }),
 *   ],
 * })
 * ```
 */
export const graphQLPlugin = definePlugin<GraphQLPluginConfig>({
  slug: '@payloadcms/plugin-graphql',
  order: 0,
  plugin: ({ config, plugins: _plugins, routes, ...graphQLOptions }) => {
    if (!config.routes) {
      config.routes = {}
    }
    if (!config.routes.graphQL) {
      config.routes.graphQL = routes?.graphQL ?? DEFAULT_GRAPHQL_PATH
    }
    if (!config.routes.graphQLPlayground) {
      config.routes.graphQLPlayground = routes?.graphQLPlayground ?? DEFAULT_PLAYGROUND_PATH
    }

    config.graphQL = {
      disable: false,
      disableIntrospectionInProduction: true,
      disablePlaygroundInProduction: true,
      maxComplexity: 1000,
      schemaOutputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/schema.graphql`,
      ...config.graphQL,
      ...graphQLOptions,
    }

    return config
  },
})
