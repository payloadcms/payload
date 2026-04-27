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
      label: 'Price',
      required: true,
      admin: {
        description: 'Listed price in USD, excluding tax',
      },
    },
    {
      name: 'priceDisabled',
      type: 'number',
      label: 'Price',
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
      admin: {
        description: 'Listed prices in USD, excluding tax',
      },
    },
  ],
}

export default NumberFields
