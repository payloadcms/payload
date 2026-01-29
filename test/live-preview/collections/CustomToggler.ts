import type { CollectionConfig } from 'payload'

import { customTogglerSlug } from '../shared.js'

export const CustomToggler: CollectionConfig = {
  slug: customTogglerSlug,
  labels: {
    singular: 'Custom Toggler Page',
    plural: 'Custom Toggler Pages',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  admin: {
    useAsTitle: 'title',
    livePreview: {
      url: () => `http://localhost:3000/live-preview`,
    },
    components: {
      edit: {
        LivePreviewToggler: '/components/CustomLivePreviewToggler.js#CustomLivePreviewToggler',
      },
    },
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
    },
  ],
}
