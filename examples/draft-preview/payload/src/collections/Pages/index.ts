import type { CollectionConfig } from 'payload/types'

import richText from '../../fields/richText'
import { loggedIn } from './access/loggedIn'
import { publishedOrLoggedIn } from './access/publishedOrLoggedIn'
import formatSlug from './hooks/formatSlug'
import { formatAppURL, revalidatePage } from './hooks/revalidatePage'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    preview: doc => {
      return `${process.env.PAYLOAD_PUBLIC_SITE_URL}/api/preview?url=${encodeURIComponent(
        formatAppURL({
          doc,
        }),
      )}&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`
    },
  },
  versions: {
    drafts: true,
  },
  access: {
    read: publishedOrLoggedIn,
    create: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  hooks: {
    afterChange: [revalidatePage],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [formatSlug('title')],
      },
    },
    richText(),
  ],
}
