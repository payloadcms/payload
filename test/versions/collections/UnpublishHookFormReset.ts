import type { CollectionConfig } from 'payload'

import { unpublishHookFormResetSlug } from '../slugs.js'

const UnpublishHookFormReset: CollectionConfig = {
  slug: unpublishHookFormResetSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'note',
      type: 'text',
      label: 'Note',
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (data?._status === 'draft' && originalDoc?._status === 'published') {
          data.note = null
        }

        return data
      },
    ],
  },
  versions: {
    drafts: true,
  },
}

export default UnpublishHookFormReset
