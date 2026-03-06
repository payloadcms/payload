import type { CollectionConfig } from 'payload'

export const overrideAccessSlug = 'override-access-hooks'

export const OverrideAccessCollection: CollectionConfig = {
  slug: overrideAccessSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'beforeReadCalled',
      type: 'checkbox',
    },
    {
      name: 'beforeReadOverrideAccess',
      type: 'checkbox',
    },
    {
      name: 'afterReadCalled',
      type: 'checkbox',
    },
    {
      name: 'afterReadOverrideAccess',
      type: 'checkbox',
    },
  ],
  hooks: {
    afterRead: [
      ({ context, doc, overrideAccess }) => {
        return {
          ...doc,
          afterReadCalled: true,
          afterReadOverrideAccess: overrideAccess,
          beforeReadCalled: context['beforeReadCalled'] as boolean,
          beforeReadOverrideAccess: context['beforeReadOverrideAccess'] as boolean,
        }
      },
    ],
    beforeRead: [
      ({ context, overrideAccess }) => {
        context['beforeReadCalled'] = true
        context['beforeReadOverrideAccess'] = overrideAccess
      },
    ],
  },
}
