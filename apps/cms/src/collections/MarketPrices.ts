import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/loggedIn'

/**
 * One price per material and day, for the VgemsAI app's Research tab: the day's last price, ending as its
 * closing price. awoz-api saves them every 4 hours through POST /api/app/market-prices
 * (src/endpoints/appMarket.ts); the team can add or correct one by hand, which awoz-api then leaves alone.
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
      "Each day's last price, saved by awoz-api every 4 hours. A price added or changed here is kept as it is.",
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
        { label: 'API Ninjas', value: 'api-ninjas' },
        // The ten years before API Ninjas, from scripts/market-history (see SOURCES.md there)
        { label: 'World Bank (monthly average)', value: 'world-bank' },
        { label: 'U.S. EIA', value: 'eia' },
        // Saved by awoz-api's first version
        { label: 'Yahoo Finance', value: 'yahoo' },
        { label: 'Entered by hand', value: 'manual' },
      ],
      required: true,
    },
  ],
  hooks: {
    // Someone in the admin panel added or corrected it: awoz-api's updates must not overwrite it
    beforeChange: [({ data, req }) => (req.user ? { ...data, source: 'manual' } : data)],
  },
  indexes: [{ fields: ['material', 'date'], unique: true }],
  labels: {
    plural: 'Market prices',
    singular: 'Market price',
  },
}
