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
      name: 'defaultArray',
      type: 'array',
      label: 'Array with default components',
      admin: {
        description:
          'Baseline: array of text fields with no custom components. Rows render entirely from Payload defaults.',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          label: 'Default text field',
        },
      ],
    },
    {
      name: 'clientArray',
      type: 'array',
      label: 'Array with custom CLIENT component',
      admin: {
        description:
          'Each row contains a text field whose Field component is a custom CLIENT component (uses "use client").',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          label: 'Custom client text field',
          admin: {
            description: 'Rendered by ClientTextField.tsx ("use client").',
            components: {
              Field: './collections/Arrays/ClientTextField.js#ClientTextField',
            },
          },
        },
      ],
    },
    {
      name: 'serverArray',
      type: 'array',
      label: 'Array with custom SERVER component',
      admin: {
        description:
          'Each row contains a text field whose Field component is a custom SERVER component (RSC, no "use client").',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          label: 'Custom server text field',
          admin: {
            description: 'Rendered by ServerTextField.tsx (server component).',
            components: {
              Field: './collections/Arrays/ServerTextField.js#ServerTextField',
            },
          },
        },
      ],
    },
  ],
}
