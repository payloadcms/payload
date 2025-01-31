import type { CollectionConfig } from 'payload'

export const dataHooksSlug = 'data-hooks'

export const DataHooks: CollectionConfig = {
  slug: dataHooksSlug,
  access: {
    read: () => true,
    create: () => true,
    delete: () => true,
    update: () => true,
  },
  hooks: {
    beforeOperation: [
      ({ context, collection, args }) => {
        context['collection_beforeOperation_collection'] = JSON.stringify(collection)

        return args
      },
    ],
    beforeChange: [
      ({ context, data, collection }) => {
        context['collection_beforeChange_collection'] = JSON.stringify(collection)

        return data
      },
    ],
    afterChange: [
      ({ context, collection }) => {
        context['collection_afterChange_collection'] = JSON.stringify(collection)
      },
    ],
    beforeRead: [
      ({ context, collection }) => {
        context['collection_beforeRead_collection'] = JSON.stringify(collection)
      },
    ],
    afterRead: [
      ({ context, collection, doc }) => {
        context['collection_afterRead_collection'] = JSON.stringify(collection)

        return doc
      },
    ],
    afterOperation: [
      ({ args, result, collection }) => {
        args.req.context['collection_afterOperation_collection'] = JSON.stringify(collection)

        for (const contextKey in args.req.context) {
          if (contextKey.startsWith('collection_')) {
            result[contextKey] = args.req.context[contextKey]
          }
        }
        return result
      },
    ],
  },
  fields: [
    {
      name: 'field_collectionAndField',
      type: 'text',
      hooks: {
        beforeChange: [
          ({ collection, field, context, value }) => {
            context['field_beforeChange_CollectionAndField'] =
              JSON.stringify(collection) + JSON.stringify(field)

            return value
          },
        ],
        afterRead: [
          ({ collection, field, context }) => {
            return (
              (context['field_beforeChange_CollectionAndField'] as string) +
              JSON.stringify(collection) +
              JSON.stringify(field)
            )
          },
        ],
      },
    },
    {
      name: 'collection_beforeOperation_collection',
      type: 'text',
    },
    {
      name: 'collection_beforeChange_collection',
      type: 'text',
    },
    {
      name: 'collection_afterChange_collection',
      type: 'text',
    },
    {
      name: 'collection_beforeRead_collection',
      type: 'text',
    },
    {
      name: 'collection_afterRead_collection',
      type: 'text',
    },
    {
      name: 'collection_afterOperation_collection',
      type: 'text',
    },
  ],
}
