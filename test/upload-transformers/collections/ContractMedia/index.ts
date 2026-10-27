import type { CollectionConfig } from 'payload'

import { contractHookCalls } from '../../contractFixtures.js'
import { contractMediaDir, contractMediaSlug } from '../../shared.js'

export const ContractMedia: CollectionConfig = {
  slug: contractMediaSlug,
  access: { create: () => true, read: () => true, update: () => true },
  fields: [
    { name: 'alt', type: 'text' },
    {
      name: 'details',
      type: 'group',
      fields: [{ name: 'caption', type: 'text', required: true }],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        contractHookCalls.push({ _transforms: data._transforms, hook: 'beforeChange' })
        return data
      },
    ],
    beforeValidate: [
      ({ data }) => {
        contractHookCalls.push({ _transforms: data?._transforms, hook: 'beforeValidate' })
        return data
      },
    ],
  },
  upload: { staticDir: contractMediaDir },
  versions: false,
}
