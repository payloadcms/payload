import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/loggedIn'

/**
 * The raw materials the VgemsAI app's Research tab follows, such as gold and Brent crude, with their
 * prices in Market Prices. awoz-api reads both through src/endpoints/appMarket.ts and saves each
 * material's closing price there every day, from Yahoo Finance under its `symbol`. The six the app
 * started with are added when the CMS starts with none (src/collections/marketSeed.ts).
 */
export const MarketMaterials: CollectionConfig = {
  slug: 'market-materials',
  access: {
    create: loggedIn,
    delete: loggedIn,
    read: loggedIn,
    update: loggedIn,
  },
  admin: {
    defaultColumns: ['name', 'key', 'unit', 'symbol', 'highlight', 'active'],
    description:
      'The prices the VgemsAI app shows under Research, where people predict whether each goes up or down next month.',
    group: 'VgemsAI App',
    useAsTitle: 'name',
  },
  defaultSort: 'sortOrder',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          admin: {
            description: 'As the app shows it, e.g. Crude Oil (Brent)',
          },
          required: true,
        },
        {
          name: 'key',
          type: 'text',
          admin: {
            description:
              "The app's name for it, e.g. gold. People's predictions are kept under it: don't change it once they have voted.",
          },
          index: true,
          required: true,
          unique: true,
          validate: (value: null | string | undefined) =>
            /^[a-z0-9-]{1,32}$/.test(value ?? '') ||
            'Use 1 to 32 lowercase letters, digits and hyphens, e.g. gold.',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'unit',
          type: 'text',
          admin: {
            description: 'e.g. USD/oz, USD/lb, USD/bbl',
          },
          required: true,
        },
        {
          name: 'symbol',
          type: 'text',
          admin: {
            description:
              'Its Yahoo Finance symbol, e.g. GC=F for gold: awoz-api saves its price every day. Leave it empty to enter the prices by hand under Market Prices.',
          },
        },
        {
          name: 'icon',
          type: 'text',
          admin: {
            description: 'An SF Symbols name, e.g. circle.hexagongrid.fill',
          },
          defaultValue: 'chart.line.uptrend.xyaxis',
          required: true,
        },
      ],
    },
    {
      name: 'prices',
      type: 'join',
      admin: {
        defaultColumns: ['date', 'price', 'source'],
      },
      collection: 'market-prices',
      defaultLimit: 30,
      defaultSort: '-date',
      on: 'material',
    },
    {
      name: 'active',
      type: 'checkbox',
      admin: {
        description:
          'Shown in the app, with a price saved every day. Untick it to hide it and keep its prices.',
        position: 'sidebar',
      },
      defaultValue: true,
      index: true,
    },
    {
      name: 'highlight',
      type: 'checkbox',
      admin: {
        description: 'Also shown as a chart under Highlight Trends, and in the price widget',
        position: 'sidebar',
      },
      defaultValue: false,
    },
    {
      name: 'sortOrder',
      type: 'number',
      admin: {
        description: 'Lower numbers come first',
        position: 'sidebar',
      },
      defaultValue: 0,
    },
  ],
  hooks: {
    // Its prices mean nothing without it
    afterDelete: [
      async ({ doc, req }) => {
        await req.payload.db.deleteMany({
          collection: 'market-prices',
          req,
          where: { material: { equals: doc.id } },
        })
      },
    ],
  },
  labels: {
    plural: 'Market materials',
    singular: 'Market material',
  },
}
