import type { CollectionConfig } from 'payload'

import { textFieldsSlug } from '../../slugs.js'

const TextFields: CollectionConfig = {
  slug: textFieldsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'slug-value',
      admin: {
        description: 'The public-facing title of this post',
      },
    },
    {
      name: 'favoriteFruit',
      type: 'text',
      hasMany: true,
      label: 'Favorite Fruit',
      defaultValue: [
        'Apples',
        'Oranges',
        'Strawberries',
        'Grapes',
        'Pineapples',
        'Bananas',
        'Raspberries',
        'Blueberries',
      ],
      admin: {
        description: 'List your favorite fruits',
      },
    },
    {
      name: 'textDisabled',
      type: 'text',
      label: 'Disabled Text',
      defaultValue: 'slug-value',
      admin: {
        disabled: true,
        description: 'This field is disabled',
      },
    },
    {
      name: 'textReadOnly',
      type: 'text',
      label: 'Read Only Text',
      defaultValue: 'slug-value',
      admin: {
        readOnly: true,
        description: 'This field is read-only',
      },
    },
  ],
}

export default TextFields
