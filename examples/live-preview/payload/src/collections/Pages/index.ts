import type { CollectionConfig } from 'payload/types'

import richText from '../../fields/richText'
import { loggedIn } from './access/loggedIn'
import formatSlug from './hooks/formatSlug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: loggedIn,
    delete: loggedIn,
    read: () => true,
    update: loggedIn,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data }) =>
        `${process.env.PAYLOAD_PUBLIC_SITE_URL}${data.slug !== 'home' ? `/${data.slug}` : ''}`,
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
      name: 'slug',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [formatSlug('title')],
      },
      index: true,
      label: 'Slug',
    },
    richText(),
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 200,
      },
    },
  },
}
