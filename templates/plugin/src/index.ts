import type { CollectionSlug, Config } from 'payload'

export type MyPluginConfig = {
  /**
   * List of collections to add a custom field
   */
  collections?: Partial<Record<CollectionSlug, true>>
  disabled?: boolean
}

export const myPlugin =
  (pluginOptions: MyPluginConfig) =>
  (config: Config): Config => {
    if (!config.collections) {
      config.collections = []
    }

    config.collections.push({
      slug: 'plugin-collection',
      fields: [
        {
          name: 'id',
          type: 'text',
        },
      ],
    })

    if (pluginOptions.collections) {
      for (const collectionSlug in pluginOptions.collections) {
        const collection = config.collections.find(
          (collection) => collection.slug === collectionSlug,
        )

        if (collection) {
          collection.fields.push({
            name: 'addedByPlugin',
            type: 'text',
            admin: {
              position: 'sidebar',
            },
          })
        }
      }
    }

    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginOptions.disabled) {
      return config
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    if (!config.admin) {
      config.admin = {}
    }

    if (!config.admin.components) {
      config.admin.components = {}
    }

    if (!config.admin.components.beforeDashboard) {
      config.admin.components.beforeDashboard = []
    }

    config.admin.components.beforeDashboard.push(
      `plugin-package-name-placeholder/client#BeforeDashboardClient`,
    )
    config.admin.components.beforeDashboard.push(
      `plugin-package-name-placeholder/rsc#BeforeDashboardServer`,
    )

    config.endpoints.push({
      handler: () => {
        return Response.json({ message: 'Hello from custom endpoint' })
      },
      method: 'get',
      path: '/my-plugin-endpoint',
    })

    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      // Ensure we are executing any existing onInit functions before running our own.
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }

      const { totalDocs } = await payload.count({
        collection: 'plugin-collection',
        where: {
          id: {
            equals: 'seeded-by-plugin',
          },
        },
      })

      if (totalDocs === 0) {
        await payload.create({
          collection: 'plugin-collection',
          data: {
            id: 'seeded-by-plugin',
          },
        })
      }
    }

    return config
  }
