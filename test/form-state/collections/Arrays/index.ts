import type { CollectionConfig } from 'payload'

export const arraysSlug = 'arrays'

export const ArraysCollection: CollectionConfig = {
  slug: arraysSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'showDefault',
      type: 'checkbox',
      label: 'Show default Payload component',
    },
    {
      name: 'conditionalDefaultText',
      type: 'text',
      label: 'Default Payload component',
      admin: {
        condition: './collections/Arrays/conditions.js#showDefault',
      },
    },
    {
      name: 'showClient',
      type: 'checkbox',
      label: 'Show custom CLIENT component',
    },
    {
      name: 'conditionalClientText',
      type: 'text',
      label: 'Custom client text field',
      admin: {
        components: {
          Field: './collections/Arrays/ClientTextField.js#ClientTextField',
        },
        condition: './collections/Arrays/conditions.js#showClient',
      },
    },
    {
      name: 'showServer',
      type: 'checkbox',
      label: 'Show custom SERVER component',
    },
    {
      name: 'conditionalServerText',
      type: 'text',
      label: 'Custom server text field',
      admin: {
        components: {
          Field: './collections/Arrays/ServerTextField.js#ServerTextField',
        },
        condition: './collections/Arrays/conditions.js#showServer',
      },
    },
    {
      name: 'defaultArray',
      type: 'array',
      label: 'Array with default components',
      fields: [
        {
          name: 'show',
          type: 'checkbox',
          label: 'Show default Payload component',
        },
        {
          name: 'text',
          type: 'text',
          label: 'Default text field',
          admin: {
            condition: './collections/Arrays/conditions.js#show',
          },
        },
      ],
    },
    {
      name: 'clientArray',
      type: 'array',
      label: 'Array with custom CLIENT component',
      fields: [
        {
          name: 'show',
          type: 'checkbox',
          label: 'Show conditional custom client component',
        },
        {
          name: 'text',
          type: 'text',
          label: 'Conditional custom client component',
          admin: {
            components: {
              Field: './collections/Arrays/ClientTextField.js#ClientTextField',
            },
            condition: './collections/Arrays/conditions.js#show',
          },
        },
      ],
    },
    {
      name: 'serverArray',
      type: 'array',
      label: 'Array with custom SERVER component',
      fields: [
        {
          name: 'text',
          type: 'text',
          label: 'Custom server component',
          admin: {
            components: {
              Field: './collections/Arrays/ServerTextField.js#ServerTextField',
            },
          },
        },
        {
          name: 'show',
          type: 'checkbox',
          label: 'Show conditional custom server component',
        },
        {
          name: 'textWithCondition',
          type: 'text',
          label: 'Conditional custom server component',
          admin: {
            components: {
              Field: './collections/Arrays/ServerTextField.js#ServerTextField',
            },
            condition: './collections/Arrays/conditions.js#show',
          },
        },
      ],
    },
  ],
}
