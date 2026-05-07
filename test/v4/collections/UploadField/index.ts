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
      required: true,
    },
    {
      name: 'heroImageReadOnly',
      type: 'upload',
      relationTo: uploadsSlug,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'heroImageHasMany',
      type: 'upload',
      relationTo: uploadsSlug,
      hasMany: true,
    },
    {
      name: 'heroImageHasManyReadOnly',
      type: 'upload',
      relationTo: uploadsSlug,
      hasMany: true,
      label: 'Hero Images (Has Many, Read Only)',
      admin: {
        readOnly: true,
      },
    },
  ],
}

export default UploadFields
