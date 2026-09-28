import type { CollectionConfig } from 'payload'

import { isAdmin, isEditor, signedIn } from '../../access.js'

export const Experiments: CollectionConfig = {
  slug: 'experiments',
  access: { create: isEditor, delete: isAdmin, read: signedIn, update: isEditor },
  admin: {
    defaultColumns: ['name', 'status', 'enabled', 'updatedAt'],
    description: 'A notebook for your tests. These records do not change Payload configuration.',
    group: 'Content',
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    { name: 'hypothesis', type: 'textarea' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'planned',
      options: ['planned', 'running', 'complete', 'paused'],
    },
    { name: 'enabled', type: 'checkbox', defaultValue: false },
    { name: 'settings', type: 'json', required: true },
    {
      name: 'subjects',
      type: 'relationship',
      hasMany: true,
      relationTo: ['articles', 'products', 'events'],
    },
    {
      name: 'observations',
      type: 'array',
      fields: [
        { name: 'recordedAt', type: 'date', required: true },
        { name: 'note', type: 'textarea', required: true },
        { name: 'result', type: 'select', options: ['pass', 'fail', 'inconclusive'] },
      ],
    },
  ],
  versions: { maxPerDoc: 20 },
}
