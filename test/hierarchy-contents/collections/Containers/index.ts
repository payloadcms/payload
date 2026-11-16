import type { CollectionConfig } from 'payload'

import { containerParentField, containersSlug } from '../../shared.js'

export const Containers: CollectionConfig = {
  slug: containersSlug,
  access: {
    read: ({ req }) =>
      req.context.denyContainers
        ? false
        : req.context.denyContainerID
          ? { id: { not_equals: req.context.denyContainerID } }
          : true,
  },
  admin: { baseFilter: () => ({ hidden: { not_equals: true } }), useAsTitle: 'name' },
  defaultSort: 'name',
  fields: [
    { name: 'name', type: 'text', access: { read: ({ req }) => !req.context.denyContainerTitles } },
    { name: 'hidden', type: 'checkbox' },
  ],
  hierarchy: {
    allowHasMany: false,
    collectionSpecific: true,
    parentFieldName: containerParentField,
  },
}
