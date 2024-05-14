import type { CollectionConfig } from 'payload/types'

import type { Page } from '../../payload-types'

import { admins } from '../../access/admins'
import { usersOrPublished } from '../../access/usersOrPublished'
import { Archive } from '../../blocks/ArchiveBlock'
import { CallToAction } from '../../blocks/CallToAction'
import { Content } from '../../blocks/Content'
import { MediaBlock } from '../../blocks/MediaBlock'
import { hero } from '../../fields/hero'
import { slugField } from '../../fields/slug'
import { populateArchiveBlock } from '../../hooks/populateArchiveBlock'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { preview } from '../../utilities/preview'
import { revalidatePage } from './hooks/revalidatePage'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: admins,
    delete: admins,
    read: usersOrPublished,
    update: admins,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data }) => `${process.env.NEXT_PUBLIC_SERVER_URL}${`/${data.slug}`}`,
    },
    preview: (doc: Page) => preview({ path: `/${typeof doc?.slug === 'string' ? doc.slug : ''}` }),
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            hero,
          ],
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
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    afterRead: [populateArchiveBlock],
    beforeChange: [populatePublishedAt],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 30,
  },
}
