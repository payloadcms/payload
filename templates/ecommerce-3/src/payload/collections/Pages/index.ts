import type { CollectionConfig } from 'payload'

import { Banner } from '@/payload/blocks/Banner'
import { Carousel } from '@/payload/blocks/Carousel'
import { ThreeItemGrid } from '@/payload/blocks/ThreeItemGrid'
import { generatePreviewPath } from '@/payload/utilities/generatePreviewPath'

import { admins } from '../../access/admins'
import { Archive } from '../../blocks/ArchiveBlock'
import { CallToAction } from '../../blocks/CallToAction'
import { Content } from '../../blocks/Content'
import { MediaBlock } from '../../blocks/MediaBlock'
import { hero } from '../../fields/hero'
import { slugField } from '../../fields/slug'
import { adminsOrPublished } from './access/adminsOrPublished'
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
    livePreview: {
      url: ({ data }) => {
        const path = generatePreviewPath({
          path: `/${typeof data?.slug === 'string' ? data.slug : ''}`,
        })
        return `${process.env.NEXT_PUBLIC_SERVER_URL}${path}`
      },
    },
    preview: (doc) =>
      generatePreviewPath({ path: `/${typeof doc?.slug === 'string' ? doc.slug : ''}` }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'publishedOn',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
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
              blocks: [CallToAction, Content, MediaBlock, Archive, Carousel, ThreeItemGrid, Banner],
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
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 50,
  },
}
