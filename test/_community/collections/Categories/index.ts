import type { CollectionConfig } from 'payload'

import { contentAccess } from '../../access.js'
import { slugField } from '../../fields.js'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: contentAccess,
  admin: { group: 'Content', useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    slugField,
    { name: 'description', type: 'textarea', localized: true },
    { name: 'parent', type: 'relationship', relationTo: 'categories' },
    { name: 'color', type: 'text', defaultValue: '#517665' },
  ],
}
