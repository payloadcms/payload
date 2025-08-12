import type { CollectionConfig } from 'payload'

import { numberFieldsSlug } from '../../slugs.js'

export const defaultNumber = 5

const NumberFields: CollectionConfig = {
  slug: numberFieldsSlug,
  admin: {
    useAsTitle: 'number',
  },
  fields: [
    {
      name: 'number',
      type: 'number',
    },
    {
      name: 'min',
      type: 'number',
      min: 10,
    },
    {
      name: 'max',
      type: 'number',
      max: 10,
    },
    {
      name: 'positiveNumber',
      type: 'number',
      min: 0,
    },
    {
      name: 'negativeNumber',
      type: 'number',
      max: 0,
    },
    {
      name: 'decimalMin',
      type: 'number',
      min: 0.5,
    },
    {
      name: 'decimalMax',
      type: 'number',
      max: 0.5,
    },
    {
      name: 'defaultNumber',
      type: 'number',
      defaultValue: defaultNumber,
    },
    {
      name: 'hasMany',
      type: 'number',
      hasMany: true,
      min: 5,
      max: 100,
    },
    {
      name: 'validatesHasMany',
      type: 'number',
      hasMany: true,
      validate: (value) => {
        if (value && !Array.isArray(value)) {
          return 'value should be an array'
        }
        return true
      },
    },
    {
      name: 'localizedHasMany',
      type: 'number',
      hasMany: true,
      localized: true,
    },
    {
      name: 'withMinRows',
      type: 'number',
      hasMany: true,
      minRows: 2,
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'numbers',
          type: 'number',
          hasMany: true,
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'blockWithNumber',
          fields: [
            {
              name: 'numbers',
              type: 'number',
              hasMany: true,
            },
          ],
        },
      ],
    },
  ],
}

export default NumberFields
