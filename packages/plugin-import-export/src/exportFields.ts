import type { Field } from 'payload'

import { getFilename } from './export/getFilename.js'

const exportCollectionFields: Field[] = [
  {
    name: 'slug',
    type: 'text',
    required: true,
  },
  {
    name: 'fields',
    type: 'text',
    hasMany: true,
  },

  {
    name: 'limit',
    type: 'number',
    label: 'Limit',
  },
  {
    name: 'sort',
    type: 'text',
    hasMany: true,
    label: 'Sort By',
  },
  {
    name: 'where',
    type: 'json',
  },
]

export const fields: Field[] = [
  {
    name: 'name',
    type: 'text',
    defaultValue: () => getFilename(),
    label: 'File Name',
    virtual: true,
  },
  {
    name: 'format',
    type: 'select',
    label: 'Export Format',
    options: [
      {
        label: 'JSON',
        value: 'json',
      },
      {
        label: 'CSV',
        value: 'csv',
      },
    ],
    required: true,
  },
  {
    name: 'collections',
    type: 'array',
    fields: exportCollectionFields,
  },
  {
    name: 'locales',
    type: 'text',
    hasMany: true,
    label: 'Locales',
  },
  // {
  //   name: 'globals',
  //   type: 'text',
  //   hasMany: true,
  // },
]
