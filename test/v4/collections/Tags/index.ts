import type { CollectionConfig } from 'payload'

import { getHierarchyFieldName } from 'payload'

import { tagsSlug } from '../../slugs.js'

const Tags: CollectionConfig = {
  slug: tagsSlug,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
  hierarchy: {
    admin: {
      components: {
        Icon: {
          clientProps: { color: 'muted' },
          path: '@payloadcms/ui#TagIcon',
        },
      },
      treeLimit: 100,
    },
    allowHasMany: true,
    collectionSpecific: { fieldName: 'allowedCollections' },
    // Keep the default field name so tag membership fields on related
    // collections are not renamed away from `_h_tags`
    parentFieldName: getHierarchyFieldName(tagsSlug),
  },
  labels: {
    plural: 'Tags',
    singular: 'Tag',
  },
  versions: false,
}

export default Tags
