import AlertBox from '@/components/AlertBox'
import type { CollectionConfig } from 'payload/types'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'alertBox',
      type: 'ui',
      admin: {
        components: {
          Field: AlertBox,
        },
      },
    },
  ],
}
