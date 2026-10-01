import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { docControlsSlug, foldersSlug } from '../../slugs.js'

const DocControls: CollectionConfig = {
  slug: docControlsSlug,
  admin: {
    preview: () => '/preview',
    useAsTitle: 'title',
  },
  trash: true,
  versions: {
    drafts: {
      schedulePublish: true,
      // Toggle for visual testing of autosave in document controls
      // autosave: true,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
    },
    {
      type: 'text',
      name: 'test',
      admin: {
        position: 'sidebar',
      },
    },
    createFolderField({ relationTo: foldersSlug }),
  ],
}

export default DocControls
