/* eslint-disable no-param-reassign */

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { dataHooksGlobalSlug } from '../../globals/Data'

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
        context['collection_beforeOperation_collection'] = JSON.stringify(collection)

        return args
      },
    ],

    beforeChange: [
      async ({ req, context, data, collection }) => {
        context['collection_beforeChange_collection'] = JSON.stringify(collection)
        await req.payload.findGlobal({
          slug: dataHooksGlobalSlug,
        })
        return data
      },
    ],
    afterChange: [
      async ({ context, collection }) => {
        context['collection_afterChange_collection'] = JSON.stringify(collection)
      },
    ],
    beforeRead: [
      async ({ context, collection }) => {
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
