import type { CollectionConfig } from 'payload'

import { childrenSlug, parentsSlug, recordAccess } from '../../shared.js'

export const Parents: CollectionConfig = {
  slug: parentsSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  graphQL: {
    pluralName: 'FieldAccessContextParents',
    singularName: 'FieldAccessContextParent',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'accessCreateProbe',
      type: 'text',
      access: {
        create: recordAccess({
          fieldName: 'accessCreateProbe',
          operation: 'create',
          source: 'field-access',
        }),
      },
    },
    {
      name: 'accessReadProbe',
      type: 'text',
      access: {
        read: recordAccess({
          fieldName: 'accessReadProbe',
          operation: 'read',
          source: 'field-access',
        }),
      },
    },
    {
      name: 'accessUpdateProbe',
      type: 'text',
      access: {
        update: recordAccess({
          fieldName: 'accessUpdateProbe',
          operation: 'update',
          source: 'field-access',
        }),
      },
    },
    {
      name: 'distinctProbe',
      type: 'text',
      access: {
        read: recordAccess({
          fieldName: 'distinctProbe',
          operation: 'read',
          source: 'find-distinct',
        }),
      },
    },
    {
      name: 'permissionsProbe',
      type: 'text',
      access: {
        read: recordAccess({
          fieldName: 'permissionsProbe',
          operation: 'read',
          source: 'permissions',
        }),
      },
    },
    {
      name: 'child',
      relationTo: childrenSlug,
      type: 'relationship',
    },
  ],
}
