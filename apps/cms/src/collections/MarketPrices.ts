import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/loggedIn'

/**
 * One closing price per material and day, for the VgemsAI app's Research tab. awoz-api saves them every
 * day through POST /api/app/market-prices (src/endpoints/appMarket.ts); the team can add or correct one by
 * hand, which awoz-api then leaves alone.
 */
export const MarketPrices: CollectionConfig = {
  slug: 'market-prices',
  access: {
    create: loggedIn,
    delete: loggedIn,
    read: loggedIn,
    update: loggedIn,
  },
  admin: {
    defaultColumns: ['material', 'date', 'price', 'source'],
    description:
      'Closing prices, saved by awoz-api every day. A price added or changed here is kept as it is.',
    group: 'VgemsAI App',
  },
  defaultSort: '-date',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'material',
          type: 'relationship',
          index: true,
          relationTo: 'market-materials',
          required: true,
        },
        {
          name: 'date',
          type: 'date',
          admin: {
            date: { displayFormat: 'yyyy-MM-dd', pickerAppearance: 'dayOnly' },
            description: 'The trading day',
          },
          index: true,
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          admin: {
            description: "In the material's unit",
          },
          min: 0,
          required: true,
        },
      ],
    },
    {
      name: 'source',
      type: 'select',
      admin: {
        description: 'Where the price comes from. Saving it here makes it "Entered by hand".',
        position: 'sidebar',
        readOnly: true,
      },
      defaultValue: 'manual',
      options: [
        { label: 'Yahoo Finance', value: 'yahoo' },
        { label: 'Entered by hand', value: 'manual' },
      ],
      required: true,
    },
  ],
  hooks: {
    // Someone in the admin panel added or corrected it: awoz-api's daily update must not overwrite it
    beforeChange: [({ data, req }) => (req.user ? { ...data, source: 'manual' } : data)],
  },
  indexes: [{ fields: ['material', 'date'], unique: true }],
  labels: {
    plural: 'Market prices',
    singular: 'Market price',
  },
}
