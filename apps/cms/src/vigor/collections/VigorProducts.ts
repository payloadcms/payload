import type { Access, CollectionConfig, Condition, FieldAccess, Where } from 'payload'

import { text, textarea } from 'payload/shared'

import { bodyField, imageField, requiredInEnglish, slugField, sortOrderField } from '../fields'
import { badges, gemstones, metals, productCategories, units } from '../options'
import { revalidateVigorAfterChange, revalidateVigorAfterDelete } from '../revalidate'

/**
 * Logged-in users see every product; everyone else, including the website, only published products
 * that aren't hidden ("Hide on the website"). A hidden product is never sent outside the admin panel.
 */
const publishedAndShown: Access = ({ req }) => {
  const shown: Where = { and: [{ _status: { equals: 'published' } }, { hidden: { not_equals: true } }] }
  return req.user ? true : shown
}

/**
 * The price and the old-website fields are for editors only: the website and other visitors never
 * get them
 */
const loggedInOnly: FieldAccess = ({ req }) => Boolean(req.user)

/** Shown only on products imported from the old website */
const isLegacy: Condition = (data) => Boolean(data?.legacyCode)

/** The Vigor website's catalog: /products and a page per product at /products/<slug> */
export const VigorProducts: CollectionConfig = {
  slug: 'vigor-products',
  access: {
    read: publishedAndShown,
  },
  admin: {
    defaultColumns: [
      'name',
      'sku',
      'category',
      'price',
      'badge',
      'legacyHint',
      'hidden',
      '_status',
    ],
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
      name: 'stones',
      type: 'select',
      admin: {
        description: 'Every gemstone this style comes in.',
      },
      hasMany: true,
      label: 'Gemstones',
      options: gemstones,
      required: true,
    },
    {
      name: 'sizes',
      type: 'text',
      admin: {
        description:
          'Every size this style comes in, one at a time, e.g. 8 mm, 12 × 28 mm, US 6. If a gemstone comes in fewer sizes, say so in the body.',
      },
      hasMany: true,
      label: 'Sizes',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'metal',
          type: 'select',
          options: metals,
          required: true,
        },
        {
          name: 'weight',
          type: 'text',
          admin: {
            description: 'Optional, e.g. 1.20 ct emerald, 0.45 ct diamonds; inner length 19 cm',
          },
          label: 'Weight and details',
          localized: true,
        },
      ],
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
      // Never on the website: the VgemsAI app shows it to signed-in users only
      // (src/endpoints/appProducts.ts)
      name: 'price',
      type: 'number',
      access: { read: loggedInOnly },
      admin: {
        description:
          'Optional, in US dollars per unit (above). Only people signed in to the VgemsAI app see it; the website and its visitors never get it. Empty: "price on request". Publish the change to apply it.',
        step: 0.01,
      },
      label: 'Price (USD)',
      min: 0,
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
    {
      name: 'hidden',
      type: 'checkbox',
      admin: {
        description:
          'Takes the product off the website (its page, the catalog, search and Vigor AI) without unpublishing or deleting it. Publish the change to apply it; untick and publish to show it again.',
        position: 'sidebar',
      },
      defaultValue: false,
      label: 'Hide on the website',
    },
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
    // Filled in by scripts/import-legacy-catalog.ts, to check an imported product before publishing it
    {
      name: 'legacyCode',
      type: 'text',
      access: { read: loggedInOnly },
      admin: {
        condition: isLegacy,
        description: 'Style code on the old website',
        position: 'sidebar',
        readOnly: true,
      },
      index: true,
      label: 'Old website: code',
    },
    {
      name: 'legacyHint',
      type: 'select',
      access: { read: loggedInOnly },
      admin: {
        condition: isLegacy,
        description:
          'What the old records suggest. Likely: photo and several records, seen 2012 or later. Old: no photo, only seen before 2010. Doubtful: inactive in the 2016 stock list.',
        position: 'sidebar',
        readOnly: true,
      },
      label: 'Old website: hint',
      options: [
        { label: 'Likely', value: 'likely' },
        { label: 'Check', value: 'check' },
        { label: 'Old', value: 'old' },
        { label: 'Doubtful', value: 'doubtful' },
      ],
    },
    {
      name: 'legacyLastSeen',
      type: 'number',
      access: { read: loggedInOnly },
      admin: {
        condition: isLegacy,
        description: 'Latest year an old record shows it',
        position: 'sidebar',
        readOnly: true,
      },
      label: 'Old website: last seen',
    },
    {
      name: 'legacyNotes',
      type: 'textarea',
      access: { read: loggedInOnly },
      admin: {
        condition: isLegacy,
        description:
          'Everything the old website knew about this style: its stones and sizes, where it was seen, the text of the old catalogs, and what the import had to guess. Not shown on the website.',
        readOnly: true,
        rows: 14,
      },
      label: 'Old website: notes',
    },
    {
      // When the import last wrote this product: if it's still a draft that nobody has saved since,
      // running the import again may rebuild it from the old catalog
      name: 'legacyImportedAt',
      type: 'date',
      access: { read: loggedInOnly },
      admin: { hidden: true },
    },
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
