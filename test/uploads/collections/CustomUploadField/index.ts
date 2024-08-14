import type { CollectionConfig } from 'payload'

import { customUploadFieldSlug } from '../../shared.js'

export const CustomUploadFieldCollection: CollectionConfig = {
  slug: customUploadFieldSlug,
  upload: true,
  admin: {
    components: {
      edit: {
        Upload: '/collections/CustomUploadField/components/CustomUpload/index.js#CustomUploadRSC',
      },
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
