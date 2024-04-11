import type { CollectionConfig } from 'payload/types'

import { admins } from '../../access/admins'
import { adminsOrPublished } from '../../access/adminsOrPublished'
import { Archive } from '../../blocks/ArchiveBlock'
import { CallToAction } from '../../blocks/CallToAction'
import { Content } from '../../blocks/Content'
import { MediaBlock } from '../../blocks/MediaBlock'
import { hero } from '../../fields/hero'
import { slugField } from '../../fields/slug'
import { populateArchiveBlock } from '../../hooks/populateArchiveBlock'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { revalidatePage } from './hooks/revalidatePage'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: admins,
    delete: admins,
    read: adminsOrPublished,
    update: admins,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    preview: (doc) => {
      return `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/next/preview?url=${encodeURIComponent(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/${doc.slug !== 'home' ? doc.slug : ''}`,
      )}&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: 'Hero',
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock, Archive],
              required: true,
            },
          ],
          label: 'Content',
        },
      ],
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    afterRead: [populateArchiveBlock],
    beforeChange: [populatePublishedAt],
  },
  versions: {
    drafts: true,
  },
}
