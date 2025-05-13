import type { CollectionConfig } from 'payload'

import { Archive } from '../blocks/ArchiveBlock/index.js'
import { CallToAction } from '../blocks/CallToAction/index.js'
import { Content } from '../blocks/Content/index.js'
import { MediaBlock } from '../blocks/MediaBlock/index.js'
import { hero } from '../fields/hero.js'
import { mediaSlug, ssrAutosavePagesSlug, tenantsSlug } from '../shared.js'

export const SSRAutosave: CollectionConfig = {
  slug: ssrAutosavePagesSlug,
  labels: {
    singular: 'SSR Autosave Page',
    plural: 'SSR Autosave Pages',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  versions: {
    drafts: {
      autosave: {
        interval: 375,
      },
    },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['id', 'title', 'slug', 'createdAt'],
    preview: (doc) => `/live-preview/ssr-autosave/${doc?.slug}`,
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: tenantsSlug,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [hero],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock, Archive],
            },
          ],
        },
      ],
    },
    {
      name: 'meta',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: mediaSlug,
        },
      ],
    },
  ],
}
