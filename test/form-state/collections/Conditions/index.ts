import type { CollectionConfig } from 'payload'

export const conditionsSlug = 'conditions'

export const ConditionsCollection: CollectionConfig = {
  slug: conditionsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'showConditionalFields',
      type: 'checkbox',
      label: 'Show conditional fields?',
    },
    {
      name: 'conditionalTextField',
      type: 'text',
      label: 'Default Payload component',
      admin: {
        condition: './collections/Conditions/conditions/showWhenChecked.js#showWhenChecked',
      },
    },
    {
      name: 'conditionalServerTextField',
      type: 'text',
      label: 'Custom server component',
      admin: {
        components: {
          Field: './collections/Conditions/components/ServerTextField.js#ServerTextField',
        },
        condition: './collections/Conditions/conditions/showWhenChecked.js#showWhenChecked',
      },
    },
    {
      name: 'conditionalClientTextField',
      type: 'text',
      label: 'Custom client component',
      admin: {
        components: {
          Field: './collections/Conditions/components/ClientTextField.js#ClientTextField',
        },
        condition: './collections/Conditions/conditions/showWhenChecked.js#showWhenChecked',
      },
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'showConditionalFields',
          type: 'checkbox',
          label: 'Show conditional fields?',
        },
        {
          name: 'conditionalRowField',
          type: 'text',
          label: 'Default Payload component',
          admin: {
            condition:
              './collections/Conditions/conditions/showWhenRowChecked.js#showWhenRowChecked',
          },
        },
        {
          name: 'conditionalRowServerField',
          type: 'text',
          label: 'Custom server component',
          admin: {
            components: {
              Field: './collections/Conditions/components/ServerTextField.js#ServerTextField',
            },
            condition:
              './collections/Conditions/conditions/showWhenRowChecked.js#showWhenRowChecked',
          },
        },
        {
          name: 'conditionalRowClientField',
          type: 'text',
          label: 'Custom client component',
          admin: {
            components: {
              Field: './collections/Conditions/components/ClientTextField.js#ClientTextField',
            },
            condition:
              './collections/Conditions/conditions/showWhenRowChecked.js#showWhenRowChecked',
          },
        },
      ],
    },
  ],
}
