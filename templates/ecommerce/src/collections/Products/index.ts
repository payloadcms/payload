import type { CollectionConfig } from 'payload/types'

import { admins } from '../../access/admins'
import { Archive } from '../../blocks/Archive'
import { CallToAction } from '../../blocks/CallToAction'
import { Content } from '../../blocks/Content'
import { MediaBlock } from '../../blocks/Media'
import { slugField } from '../../fields/slug'
import { populateArchiveBlock } from '../../hooks/populateArchiveBlock'
import { populatePublishedDate } from '../../hooks/populatePublishedDate'
import { checkUserPurchases } from './access/checkUserPurchases'
import { beforeProductChange } from './hooks/beforeChange'
import { deleteProductFromCarts } from './hooks/deleteProductFromCarts'
import { ProductSelect } from './ui/ProductSelect'

export const ProductFields: CollectionConfig['fields'] = [
  {
    name: 'title',
    type: 'text',
    required: true,
  },
  {
    name: 'publishedDate',
    type: 'date',
    admin: {
      position: 'sidebar',
    },
  },
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Content',
        fields: [
          {
            name: 'layout',
            type: 'blocks',
            required: true,
            blocks: [CallToAction, Content, MediaBlock, Archive],
          },
        ],
      },
      {
        label: 'Product Details',
        fields: [
          {
            name: 'stripeProductID',
            label: 'Stripe Product',
            type: 'text',
            admin: {
              components: {
                Field: ProductSelect,
              },
            },
          },
          {
            name: 'priceJSON',
            label: 'Price JSON',
            type: 'textarea',
            admin: {
              readOnly: true,
              hidden: true,
              rows: 10,
            },
          },
          {
            name: 'paywall',
            label: 'Paywall',
            type: 'blocks',
            access: {
              read: checkUserPurchases,
            },
            blocks: [CallToAction, Content, MediaBlock, Archive],
          },
        ],
      },
    ],
  },
  {
    name: 'categories',
    type: 'relationship',
    relationTo: 'categories',
    hasMany: true,
    admin: {
      position: 'sidebar',
    },
  },
  slugField(),
  {
    name: 'skipSync',
    label: 'Skip Sync',
    type: 'checkbox',
    admin: {
      position: 'sidebar',
      readOnly: true,
      hidden: true,
    },
  },
]

const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'stripeProductID', '_status'],
  },
  hooks: {
    beforeChange: [populatePublishedDate, beforeProductChange],
    afterRead: [populateArchiveBlock],
    afterDelete: [deleteProductFromCarts],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: ProductFields,
}

export default Products
