import type { CollectionConfig } from 'payload'

import { customUploadFieldSlug } from '../../shared.js'
import { CustomUploadRSC } from './components/CustomUpload/index.js'

export const CustomUploadFieldCollection: CollectionConfig = {
  slug: customUploadFieldSlug,
  upload: {
    handlers: [
      (req, res) => {
        res.headers.set('Cache-control', 'public max-age=86400')
      },
    ],
  },
  admin: {
    components: {
      edit: {
        Upload: CustomUploadRSC,
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
