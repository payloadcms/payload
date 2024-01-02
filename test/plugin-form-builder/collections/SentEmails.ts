import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { sentEmailSlug } from '../shared'

export const SentEmails: CollectionConfig = {
  slug: sentEmailSlug,
  admin: {
    useAsTitle: 'subject',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'to',
      type: 'text',
    },
    {
      name: 'subject',
      type: 'text',
    },
    {
      name: 'replyTo',
      type: 'text',
    },
    {
      name: 'html',
      type: 'text',
    },
    {
      name: 'from',
      type: 'text',
    },
    {
      name: 'cc',
      type: 'text',
    },
    {
      name: 'bcc',
      type: 'text',
    },
  ],
}
