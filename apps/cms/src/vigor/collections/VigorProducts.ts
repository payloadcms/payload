import type { CollectionConfig } from 'payload'

import { text, textarea } from 'payload/shared'

import { publishedOrLoggedIn } from '../../access/publishedOrLoggedIn'
import { bodyField, imageField, requiredInEnglish, slugField, sortOrderField } from '../fields'
import { badges, gemstones, metals, productCategories, units } from '../options'
import { revalidateVigorAfterChange, revalidateVigorAfterDelete } from '../revalidate'

/** The Vigor website's catalog: /products and a page per product at /products/<slug> */
export const VigorProducts: CollectionConfig = {
  slug: 'vigor-products',
  access: {
    read: publishedOrLoggedIn,
  },
  admin: {
    defaultColumns: ['name', 'sku', 'category', 'badge', 'sortOrder', '_status'],
    group: 'Vigor website',
    listSearchableFields: ['name', 'sku', 'slug'],
    useAsTitle: 'name',
  },
  defaultSort: 'sortOrder',
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      required: true,
      validate: requiredInEnglish(text),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          options: productCategories,
          required: true,
        },
        {
          name: 'badge',
          type: 'select',
          admin: {
            description: 'Products with a badge are featured on the home page.',
          },
          options: badges,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'stone',
          type: 'select',
          label: 'Gemstone',
          options: gemstones,
          required: true,
        },
        {
          name: 'metal',
          type: 'select',
          options: metals,
          required: true,
        },
      ],
    },
    {
      name: 'weight',
      type: 'text',
      admin: {
        description: 'e.g. 1.20 ct emerald, 0.45 ct diamonds, size 6.5',
      },
      label: 'Weight and size',
      localized: true,
      required: true,
      validate: requiredInEnglish(text),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'moq',
          type: 'number',
          defaultValue: 1,
          label: 'Minimum order',
          min: 1,
          required: true,
        },
        {
          name: 'unit',
          type: 'select',
          defaultValue: 'piece',
          options: units,
          required: true,
        },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      required: true,
      validate: requiredInEnglish(textarea),
    },
    bodyField,
    imageField({
      description:
        'Optional product photo. Without one, the website draws the piece from its gemstone and metal.',
    }),
    slugField({ from: 'name' }),
    {
      name: 'sku',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeDuplicate: [({ value }) => (value ? `${value}-COPY` : value)],
      },
      label: 'SKU',
      required: true,
      unique: true,
    },
    sortOrderField,
  ],
  hooks: {
    afterChange: [revalidateVigorAfterChange],
    afterDelete: [revalidateVigorAfterDelete],
  },
  labels: {
    plural: 'Products',
    singular: 'Product',
  },
  versions: {
    drafts: true,
  },
}
