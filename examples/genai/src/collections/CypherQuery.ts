import { CollectionConfig } from 'payload/types'

export const CypherQuery: CollectionConfig = {
  slug: 'cypher-query',
  admin: {
    useAsTitle: 'description',
  },
  fields: [
    {
      name: 'description',
      type: 'textarea',
    },
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
        {
          label: 'write',
          value: 'write',
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
          label: 'initialization',
          value: 'initialization',
        },
        {
          label: 'vector-query',
          value: 'vector-query',
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
