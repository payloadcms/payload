import payload from 'payload'
import type { Config } from 'payload/config'
import type { CollectionConfig } from 'payload/dist/collections/config/types'
import type { Option } from 'payload/dist/fields/config/types'
import type { ZapEventHook, FindRelatedZaps, PluginOptions } from './types'

const queryRelatedZapDocs: FindRelatedZaps = async ({
  zapCollectionSlug,
  collectionSlug,
  hook,
  req,
}) => {
  return req.payload.find({
    collection: zapCollectionSlug,
    limit: 100,
    where: {
      and: [
        {
          relatedCollection: {
            equals: collectionSlug,
          },
        },
        {
          [`hooks.${hook}`]: {
            equals: true,
          },
        },
      ],
    },
  })
}

const httpMethods = {
  create: 'POST',
  update: 'PUT',
  delete: 'DELETE',
}

const zapEventHook: ZapEventHook = async (args): Promise<void> => {
  const { collectionSlug, zapCollectionSlug, hook, enabled } = args

  const isEnabled = typeof enabled === 'function' ? await enabled(args) : enabled
  if (!isEnabled) return

  const relatedZaps = await queryRelatedZapDocs({
    zapCollectionSlug,
    collectionSlug,
    hook,
    req: args.req,
  })

  const operation = hook === 'afterChange' ? args.operation : 'delete'

  if (relatedZaps?.totalDocs > 0) {
    relatedZaps.docs.forEach(zap => {
      try {
        fetch(zap.webhookEndpoint, {
          method: httpMethods[operation],
          body: JSON.stringify({
            collection: collectionSlug,
            operation,
            ...args.doc,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (error: unknown) {
        payload.logger.error(error)
      }
    })
  }
}

export const zapierPlugin =
  (options: PluginOptions) =>
  (config: Config): Config => {
    const { zapierCollectionSlug = 'zaps', enabled = true } = options
    const zapierEnabledCollectionOptions: Option[] = []

    const configCopy: Config = {
      ...config,
      collections: (config.collections || []).map(ogCollection => {
        const zapAllCollections = !options?.collections || options.collections.length === 0
        const isZapCollection = zapAllCollections
          ? true
          : options?.collections?.find(slug => slug === ogCollection.slug)

        if (isZapCollection) {
          zapierEnabledCollectionOptions.push({
            // TODO(label): use the exported `formatLabel` function from payload
            label: ogCollection?.labels?.plural || ogCollection.slug,
            value: ogCollection.slug,
          })

          return {
            ...ogCollection,
            hooks: {
              ...ogCollection.hooks,
              afterChange: [
                ...(ogCollection.hooks?.afterChange || []),
                async hookArgs => {
                  zapEventHook({
                    ...hookArgs,
                    hook: 'afterChange',
                    zapCollectionSlug: zapierCollectionSlug,
                    collectionSlug: ogCollection.slug,
                    enabled,
                  })

                  return hookArgs.doc
                },
              ],
              afterDelete: [
                ...(ogCollection.hooks?.afterDelete || []),
                async hookArgs => {
                  zapEventHook({
                    ...hookArgs,
                    hook: 'afterDelete',
                    zapCollectionSlug: zapierCollectionSlug,
                    collectionSlug: ogCollection.slug,
                    enabled,
                  })

                  return hookArgs.doc
                },
              ],
            },
          }
        }
        return ogCollection
      }),
    }

    const zapierCollection: CollectionConfig = {
      slug: zapierCollectionSlug,
      access: options?.access || {},
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'relatedCollection',
          type: 'select',
          options: zapierEnabledCollectionOptions,
          required: true,
        },
        {
          name: 'webhookEndpoint',
          type: 'text',
          required: true,
        },
        {
          name: 'hooks',
          label: 'When to send a Zap',
          type: 'group',
          fields: [
            {
              name: 'afterChange',
              type: 'checkbox',
            },
            {
              name: 'afterDelete',
              type: 'checkbox',
            },
          ],
        },
      ],
    }

    return {
      ...configCopy,
      collections: [...(configCopy.collections ?? []), zapierCollection],
    }
  }
