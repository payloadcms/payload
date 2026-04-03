import type { Config, PayloadHandler } from 'payload'

export const initClientUploads = <ExtraProps extends Record<string, unknown>, T>({
  clientHandler,
  collections,
  config,
  enabled,
  extraClientHandlerProps,
  serverHandler,
  serverHandlerPath,
}: {
  /** Path to clientHandler component */
  clientHandler: string
  collections: Record<string, T>
  config: Config
  enabled: boolean
  /** extra props to pass to the client handler */
  extraClientHandlerProps?: (collection: T) => ExtraProps
  serverHandler: PayloadHandler
  serverHandlerPath: string
}) => {
  if (enabled) {
    if (!config.endpoints) {
      config.endpoints = []
    }

    /**
     * Tracks how many times the same handler was already applied.
     * This allows to apply the same plugin multiple times, for example
     * to use different buckets for different collections.
     */
    let handlerCount = 0

    for (const endpoint of config.endpoints) {
      // We want to match on 'path', 'path-1', 'path-2', etc.
      if (endpoint.path?.startsWith(serverHandlerPath)) {
        handlerCount++
      }
    }

    if (handlerCount) {
      serverHandlerPath = `${serverHandlerPath}-${handlerCount}`
    }

    config.endpoints.push({
      handler: serverHandler,
      method: 'post',
      path: serverHandlerPath,
    })
  }

  if (!config.admin) {
    config.admin = {}
  }

  if (!config.admin.dependencies) {
    config.admin.dependencies = {}
  }
  // Ensure client handler is always part of the import map, to avoid
  // import map discrepancies between dev and prod
  config.admin.dependencies[clientHandler] = {
    type: 'function',
    path: clientHandler,
  }

  if (!config.admin.components) {
    config.admin.components = {}
  }

  if (!config.admin.components.providers) {
    config.admin.components.providers = []
  }

  // Build a map of collection configurations to pass to a single provider
  // instead of creating a provider per collection (which causes memory leaks)
  const collectionsConfig: Record<string, { prefix?: string; extra?: ExtraProps }> = {}

  for (const collectionSlug in collections) {
    const collection = collections[collectionSlug]

    let collectionPrefix: string | undefined

    if (
      collection &&
      typeof collection === 'object' &&
      'prefix' in collection &&
      typeof collection.prefix === 'string'
    ) {
      collectionPrefix = collection.prefix
    }

    collectionsConfig[collectionSlug] = {
      prefix: collectionPrefix,
      extra: extraClientHandlerProps ? extraClientHandlerProps(collection!) : undefined,
    }
  }

  // Push a single provider for all collections to avoid memory leaks
  config.admin.components.providers.push({
    clientProps: {
      collectionsConfig,
      enabled,
      serverHandlerPath,
    },
    path: clientHandler,
  })
}
