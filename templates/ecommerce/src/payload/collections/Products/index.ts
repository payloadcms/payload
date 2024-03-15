import type { CollectionConfig } from 'payload/types'

import { admins } from '../../access/admins'
import { Archive } from '../../blocks/ArchiveBlock'
import { CallToAction } from '../../blocks/CallToAction'
import { Content } from '../../blocks/Content'
import { MediaBlock } from '../../blocks/MediaBlock'
import { slugField } from '../../fields/slug'
import { populateArchiveBlock } from '../../hooks/populateArchiveBlock'
import { checkUserPurchases } from './access/checkUserPurchases'
import { beforeProductChange } from './hooks/beforeChange'
import { deleteProductFromCarts } from './hooks/deleteProductFromCarts'
import { revalidateProduct } from './hooks/revalidateProduct'
import { ProductSelect } from './ui/ProductSelect'

const Products: CollectionConfig = {
  slug: 'products',
  access: {
    create: admins,
    delete: admins,
    read: () => true,
    update: admins,
  },
  admin: {
    defaultColumns: ['title', 'stripeProductID', '_status'],
    preview: (doc) => {
      return `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/next/preview?url=${encodeURIComponent(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/products/${doc.slug}`,
      )}&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'publishedOn',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock, Archive],
              required: true,
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'stripeProductID',
              type: 'text',
              admin: {
                components: {
                  Field: ProductSelect,
                },
              },
              label: 'Stripe Product',
            },
            {
              name: 'priceJSON',
              type: 'textarea',
              admin: {
                hidden: true,
                readOnly: true,
                rows: 10,
              },
              label: 'Price JSON',
            },
            {
              name: 'enablePaywall',
              type: 'checkbox',
              label: 'Enable Paywall',
            },
            {
              name: 'paywall',
              type: 'blocks',
              access: {
                read: checkUserPurchases,
              },
              blocks: [CallToAction, Content, MediaBlock, Archive],
              label: 'Paywall',
            },
          ],
          label: 'Product Details',
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'categories',
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      filterOptions: ({ id }) => {
        return {
          id: {
            not_in: [id],
          },
        }
      },
      hasMany: true,
      relationTo: 'products',
    },
    slugField(),
    {
      name: 'skipSync',
      type: 'checkbox',
      admin: {
        hidden: true,
        position: 'sidebar',
        readOnly: true,
      },
      label: 'Skip Sync',
    },
  ],
  hooks: {
    afterChange: [revalidateProduct],
    afterDelete: [deleteProductFromCarts],
    afterRead: [populateArchiveBlock],
    beforeChange: [beforeProductChange],
  },
  versions: {
    drafts: true,
  },
}

export default Products
