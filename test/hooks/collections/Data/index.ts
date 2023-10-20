/* eslint-disable no-param-reassign */

import hash from 'object-hash'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

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
      async ({ context, collection, args }) => {
        context['collection_beforeOperation_collection'] = hash(JSON.stringify(collection))

        return args
      },
    ],

    beforeChange: [
      ({ context, data, collection }) => {
        context['collection_beforeChange_collection'] = hash(JSON.stringify(collection))

        return data
      },
    ],
    afterChange: [
      async ({ context, collection }) => {
        context['collection_afterChange_collection'] = hash(JSON.stringify(collection))
      },
    ],
    beforeRead: [
      async ({ context, collection }) => {
        context['collection_beforeRead_collection'] = hash(JSON.stringify(collection))
      },
    ],
    afterRead: [
      ({ context, req, collection, doc }) => {
        context['collection_afterRead_collection'] = hash(JSON.stringify(collection))

        return doc
      },
    ],
    afterOperation: [
      ({ args, result, collection }) => {
        args.req.context['collection_afterOperation_collection'] = hash(JSON.stringify(collection))

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
