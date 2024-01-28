import { CollectionConfig } from 'payload/types'

export const CypherQuery: CollectionConfig = {
  slug: 'cypher-query',
  admin: {
    useAsTitle: 'purpose',
  },
  fields: [
    {
      name: 'query',
      type: 'textarea',
      required: true,
    },
    {
      name: 'transaction',
      type: 'select',
      required: true,
      options: [
        {
          label: 'read',
          value: 'read',
        },
      ],
    },
    {
      name: 'purpose',
      type: 'select',
      required: true,
      options: [
        {
          label: 'small-world',
          value: 'small-world',
        },
        {
          label: 'step back',
          value: 'step-back',
        },
        {
          label: 'custom',
          value: 'custom',
        },
      ],
    },
    {
      name: 'parameters',
      type: 'json',
    },
    {
      name: 'returnData',
      type: 'json',
    },
  ],
}
