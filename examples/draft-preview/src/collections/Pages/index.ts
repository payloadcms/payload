import type { CollectionConfig } from 'payload'

import richText from '../../fields/richText'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { loggedIn } from './access/loggedIn'
import { publishedOrLoggedIn } from './access/publishedOrLoggedIn'
import { formatSlug } from './hooks/formatSlug'
import { revalidatePage } from './hooks/revalidatePage'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: loggedIn,
    delete: loggedIn,
    read: publishedOrLoggedIn,
    update: loggedIn,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    preview: (doc) => {
      const path = generatePreviewPath({
        slug: typeof doc?.slug === 'string' ? doc.slug : '',
        collection: 'pages',
      })
      return `${process.env.NEXT_PUBLIC_SERVER_URL}${path}`
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
  hooks: {
    afterChange: [revalidatePage],
  },
  versions: {
    drafts: true,
  },
}
