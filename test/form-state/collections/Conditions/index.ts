import type { Block, CollectionConfig, Tab } from 'payload'

export const conditionsSlug = 'conditions'

export const conditionalTabsBlockSlug = 'conditionalTabs'

// Returns new objects on each call, since sanitization assigns `id` to conditional tabs in place
const getConditionalTabs = (): Tab[] => [
  {
    fields: [
      {
        name: 'showExtra',
        type: 'checkbox',
      },
    ],
    label: 'Main',
  },
  {
    name: 'extra',
    admin: {
      condition: (_, siblingData) => siblingData?.showExtra === true,
    },
    fields: [
      {
        name: 'extraText',
        type: 'text',
      },
    ],
  },
]

export const ConditionalTabsBlock: Block = {
  slug: conditionalTabsBlockSlug,
  fields: [
    {
      type: 'tabs',
      tabs: getConditionalTabs(),
    },
  ],
}

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
      type: 'tabs',
      tabs: getConditionalTabs(),
    },
    {
      name: 'layout',
      type: 'blocks',
      blockReferences: [conditionalTabsBlockSlug],
      blocks: [],
    },
  ],
}
