import type { CollectionConfig, GlobalConfig } from 'payload'

import { cascadePublishGlobalSlug, cascadePublishSlug } from '../slugs.js'

export const CascadePublish: CollectionConfig = {
  slug: cascadePublishSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'relation',
      type: 'relationship',
      relationTo: 'cascade-publish-relations',
    },
  ],
  versions: {
    drafts: { cascadePublish: true },
  },
}

export const CascadePublishGlobal: GlobalConfig = {
  slug: cascadePublishGlobalSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'relation',
      type: 'relationship',
      relationTo: 'cascade-publish-relations',
    },
  ],
  versions: {
    drafts: { cascadePublish: true },
  },
}
