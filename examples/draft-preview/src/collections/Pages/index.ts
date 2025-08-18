import type { CollectionConfig, CollectionSlug } from 'payload'

import richText from '../../fields/richText'
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
    preview: ({ slug, collection }: { slug: string; collection: CollectionSlug }) => {
      const encodedParams = new URLSearchParams({
        slug,
        collection,
        path: `/${slug}`,
        previewSecret: process.env.PREVIEW_SECRET || '',
      })

      return `${process.env.NEXT_PUBLIC_SERVER_URL}/preview?${encodedParams.toString()}`
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
