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

    config.endpoints.push({
      handler: serverHandler,
      method: 'post',
      path: serverHandlerPath,
    })
  }

  if (!config.admin) {
    config.admin = {}
  }

  if (!config.admin.components) {
    config.admin.components = {}
  }

  if (!config.admin.components.providers) {
    config.admin.components.providers = []
  }

  for (const collectionSlug in collections) {
    const collection = collections[collectionSlug]

    config.admin.components.providers.push({
      clientProps: {
        collectionSlug,
        enabled,
        extra: extraClientHandlerProps ? extraClientHandlerProps(collection) : undefined,
      },
      path: clientHandler,
    })
  }
}
