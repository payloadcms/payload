import { CollectionConfig } from 'payload/types';

// Example Collection - For reference only, this must be added to payload.config.ts to be used.
const Examples: CollectionConfig = {
  slug: 'examples',
  labels: {
    singular: 'Example',
    plural: 'Examples',
  },
  admin: {
    useAsTitle: 'someField',
  },
  fields: [
    {
      name: 'someField',
      label: 'Some Field',
      type: 'text',
    },
  ],
}

export default Examples;