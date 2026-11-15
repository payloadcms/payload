import type { CollectionConfig } from 'payload'

export const conditionsSlug = 'conditions'

export const ConditionsCollection: CollectionConfig = {
  slug: conditionsSlug,
  fields: [
    {
      name: 'showField',
      type: 'checkbox',
    },
    {
      name: 'conditionalCustomField',
      type: 'text',
      admin: {
        condition: (data) => data?.showField === true,
        components: {
          Field: './collections/Conditions/CustomField.js#CustomTextField',
        },
      },
    },
    {
      type: 'row',
      admin: {
        condition: (data) => data?.showField === true,
      },
      fields: [
        {
          name: 'conditionalRowField',
          type: 'text',
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Conditional Collapsible',
      admin: {
        condition: (data) => data?.showField === true,
      },
      fields: [
        {
          name: 'conditionalCollapsibleField',
          type: 'text',
        },
      ],
    },
    {
      name: 'clientValidatedValue',
      type: 'text',
    },
    {
      name: 'address',
      type: 'group',
      admin: {
        condition: (data) => data?.showField === true,
      },
      fields: [
        {
          name: 'country',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.country === 'US',
          },
        },
      ],
    },
    {
      name: 'enabledByDefault',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'shipping',
      type: 'group',
      fields: [
        {
          name: 'region',
          type: 'text',
          defaultValue: 'US',
        },
        {
          name: 'zip',
          type: 'text',
          admin: {
            condition: (data, siblingData) =>
              data?.enabledByDefault === true && siblingData?.region === 'US',
          },
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'rowIdField',
          type: 'text',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.id),
          },
        },
      ],
    },
  ],
  versions: false,
}
