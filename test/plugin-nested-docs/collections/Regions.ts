import type { CollectionConfig } from 'payload'

import { createParentField } from '@payloadcms/plugin-nested-docs'

import { regionsSlug } from '../shared.js'

// A parent field that declares its own `filterOptions` opts out of the cycle guard the plugin
// would otherwise apply, so circular hierarchies can be saved through the API
export const Regions: CollectionConfig = {
  slug: regionsSlug,
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    createParentField(regionsSlug, {
      filterOptions: () => true,
    }),
  ],
  versions: false,
}
