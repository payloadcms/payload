import type { CollectionConfig } from 'payload'

import { UICustomClient } from './UICustomClient.js'
import { uiFieldsSlug } from './shared.js'

const UIFields: CollectionConfig = {
  slug: uiFieldsSlug,
  admin: {
    useAsTitle: 'text',
    custom: {
      'new-value': 'client available',
    },
  },
  custom: {
    'new-server-value': 'only available on server',
  },
  defaultSort: 'id',
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
    {
      type: 'ui',
      name: 'uiCustomClient',
      admin: {
        components: {
          Field: UICustomClient,
        },
        custom: {
          customValue: `client-side-configuration`,
        },
      },
      custom: {
        server: {
          serverOnly: 'string',
        },
      },
    },
  ],
}

export default UIFields
