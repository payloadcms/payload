import type { CollectionConfig } from 'payload'

import { numberFieldsSlug } from '../../slugs.js'

const NumberFields: CollectionConfig = {
  slug: numberFieldsSlug,
  fields: [
    {
      name: 'price',
      type: 'number',
      label: 'Price',
      admin: {
        description: 'Listed price in USD, excluding tax',
      },
    },
    {
      name: 'priceRequired',
      type: 'number',
      label: 'Price (Required)',
      required: true,
      admin: {
        description: 'Listed price in USD, excluding tax',
      },
    },
    {
      name: 'priceDisabled',
      type: 'number',
      label: 'Price (Disabled)',
      defaultValue: 99.99,
      admin: {
        disabled: true,
        description: 'Listed price in USD, excluding tax',
      },
    },
    {
      name: 'priceReadOnly',
      type: 'number',
      label: 'Price (Read Only)',
      defaultValue: 149.99,
      admin: {
        readOnly: true,
        description: 'Listed price in USD, excluding tax',
      },
    },
    {
      name: 'prices',
      type: 'number',
      hasMany: true,
      label: 'Prices',
      defaultValue: [123, 456, 789],
      admin: {
        description: 'Listed prices in USD, excluding tax',
      },
    },
    {
      name: 'pricesReadOnly',
      type: 'number',
      hasMany: true,
      label: 'Prices (Read Only)',
      defaultValue: [123, 456, 789],
      admin: {
        readOnly: true,
        description: 'Listed prices in USD, excluding tax',
      },
    },
  ],
}

export default NumberFields
