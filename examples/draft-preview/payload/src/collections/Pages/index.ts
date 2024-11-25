import type { CollectionConfig } from 'payload'

import richText from '../../fields/richText'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { loggedIn } from './access/loggedIn'
import { publishedOrLoggedIn } from './access/publishedOrLoggedIn'
import { formatSlug } from './hooks/formatSlug'
import { formatAppURL, revalidatePage } from './hooks/revalidatePage'

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
      if (process.env.PAYLOAD_PUBLIC_SITE_URL && process.env.PAYLOAD_PUBLIC_DRAFT_SECRET) {
        // Separate Payload and front-end setup
        return `${process.env.PAYLOAD_PUBLIC_SITE_URL}/api/preview?url=${encodeURIComponent(
          formatAppURL({ doc }),
        )}&collection=pages&slug=${doc.slug}&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`
      } else if (process.env.NEXT_PUBLIC_SERVER_URL) {
        // Unified Payload and front-end setup
        const path = generatePreviewPath({
          slug: typeof doc?.slug === 'string' ? doc.slug : '',
          collection: 'pages',
        })
        return `${process.env.NEXT_PUBLIC_SERVER_URL}${path}`
      }

      // Fallback for missing environment variables
      throw new Error(
        'Environment variables for preview functionality are not set. Ensure that either PAYLOAD_PUBLIC_SITE_URL and PAYLOAD_PUBLIC_DRAFT_SECRET, or NEXT_PUBLIC_SERVER_URL are defined.',
      )
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
