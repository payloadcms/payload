import type { CollectionConfig } from 'payload'

import { simpleNoTemplatesSlug } from '../slugs.js'

/**
 * Collection without `templates` opt-in. Used to verify that the Templates API
 * stays inert for collections that haven't opted in.
 */
export const SimpleNoTemplates: CollectionConfig = {
  slug: simpleNoTemplatesSlug,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
    },
  ],
}
