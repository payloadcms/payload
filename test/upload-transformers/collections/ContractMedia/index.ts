import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { contractHookCalls } from '../../contractFixtures.js'
import { contractMediaDir, contractMediaSlug } from '../../shared.js'

const recordHook =
  (hook: string): CollectionBeforeChangeHook =>
  ({ data }) => {
    contractHookCalls.push({ _transforms: data?._transforms, hook })
    return data
  }

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
    beforeChange: [recordHook('beforeChange')],
    beforeValidate: [recordHook('beforeValidate')],
  },
  upload: { staticDir: contractMediaDir },
  versions: { drafts: true },
}
