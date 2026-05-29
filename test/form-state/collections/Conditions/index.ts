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
      name: 'showTabs',
      type: 'checkbox',
    },
    {
      type: 'tabs',
      admin: {
        condition: (data) => data?.showTabs === true,
      },
      tabs: [
        {
          label: 'Tab One',
          admin: {
            description: 'This tab should be fully hidden when "showTabs" is unchecked',
          },
          fields: [
            {
              name: 'tabOneField',
              type: 'text',
            },
          ],
        },
        {
          label: 'Tab Two',
          fields: [
            {
              name: 'tabTwoField',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
