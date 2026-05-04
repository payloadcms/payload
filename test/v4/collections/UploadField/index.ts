import type { CollectionConfig } from 'payload'

import { uploadFieldsSlug, uploadsSlug } from '../../slugs.js'

const UploadFields: CollectionConfig = {
  slug: uploadFieldsSlug,
  fields: [
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: uploadsSlug,
      label: 'Hero Image',
    },
    {
      name: 'heroImageRequired',
      type: 'upload',
      relationTo: uploadsSlug,
      label: 'Hero Image',
      required: true,
    },
    {
      name: 'heroImageDisabled',
      type: 'upload',
      relationTo: uploadsSlug,
      label: 'Hero Image',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'heroImageHasMany',
      type: 'upload',
      relationTo: uploadsSlug,
      hasMany: true,
      label: 'Hero Image',
    },
  ],
}

export default UploadFields
