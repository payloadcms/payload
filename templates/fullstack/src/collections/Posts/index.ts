import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { CallToActionBlock, FeatureGridBlock, HeroBlock } from '../../blocks'
import { adminOnly, authenticatedOrPublished } from '../../access'
import { categoriesSlug } from '../Categories'
import { mediaSlug } from '../Media'

export const postsSlug = 'posts'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  admin: {
    defaultColumns: ['title', 'slug', 'categories', 'featuredImage', 'updatedAt'],
    useAsTitle: 'title',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: authenticatedOrPublished,
    update: adminOnly,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, admin: { position: 'sidebar' }, index: true },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: categoriesSlug,
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: mediaSlug,
      admin: { position: 'sidebar' },
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures] }),
    },
    { name: 'layout', type: 'blocks', blocks: [HeroBlock, FeatureGridBlock, CallToActionBlock] },
  ],
  versions: { drafts: true },
}
