import { CollectionConfig } from 'payload/types'
import { BeforeInput } from './Pages/BeforeInput'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      admin: {
        components: {
          beforeInput: [BeforeInput],
        },
      },
    },
  ],
}
