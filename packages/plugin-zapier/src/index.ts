import payload from 'payload'
import type { Config } from 'payload/config'
import type { CollectionConfig } from 'payload/dist/collections/config/types'
import type { Option } from 'payload/dist/fields/config/types'
import type { AddZapHook, FindRelatedZaps, PluginOptions, SendZaps, ZapHookArgs } from './types'

const findRelatedZapDocs: FindRelatedZaps = async ({
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

const sendZaps: SendZaps = async args => {
  const relatedZaps = await findRelatedZapDocs(args)

  const getMethod = (): string => {
    if (args.hook === 'afterDelete') {
      return 'DELETE'
    }
    return args.operation === 'create' ? 'POST' : 'PUT'
  }

  if (relatedZaps?.totalDocs > 0) {
    relatedZaps.docs.forEach(zap => {
      try {
        fetch(zap.webhookEndpoint, {
          method: getMethod(),
          body: JSON.stringify({
            collection: args.collectionSlug,
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

const addZapHook: AddZapHook = async (args): Promise<void> => {
  const { condition, collectionSlug, zapCollectionSlug, hook, ...rest } = args
  const passesCondition =
    condition &&
    (await condition({
      ...rest,
      hook,
      collectionSlug,
    } as ZapHookArgs))

  if (!condition || passesCondition) {
    sendZaps({
      hook,
      collectionSlug,
      zapCollectionSlug,
      ...rest,
    } as ZapHookArgs)
  }
}

export const zapierPlugin =
  (options: PluginOptions) =>
  (config: Config): Config => {
    const zapierCollectionSlug = options.zapierCollectionSlug || 'zaps'
    const zapierEnabledCollectionOptions: Option[] = []

    const configCopy: Config = {
      ...config,
      collections: (config.collections || []).map(ogCollection => {
        const zapCollectionOptions = options.zapCollections.find(
          ({ slug }) => slug === ogCollection.slug,
        )

        if (zapCollectionOptions) {
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
                  const matchingHook = zapCollectionOptions.zapHooks.find(
                    ({ type }) => type === 'afterChange',
                  )

                  if (matchingHook) {
                    addZapHook({
                      ...hookArgs,
                      hook: 'afterChange',
                      zapCollectionSlug: zapierCollectionSlug,
                      collectionSlug: ogCollection.slug,
                      condition: matchingHook?.condition,
                    })
                  }
                  return hookArgs.doc
                },
              ],
              afterDelete: [
                ...(ogCollection.hooks?.afterDelete || []),
                async hookArgs => {
                  const matchingHook = zapCollectionOptions.zapHooks.find(
                    ({ type }) => type === 'afterDelete',
                  )

                  if (matchingHook) {
                    addZapHook({
                      ...hookArgs,
                      hook: 'afterDelete',
                      zapCollectionSlug: zapierCollectionSlug,
                      collectionSlug: ogCollection.slug,
                      condition: matchingHook?.condition,
                    })
                  }
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
