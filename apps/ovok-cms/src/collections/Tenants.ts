import type { CollectionConfig } from 'payload'

import { ovokInternalStrategy } from '../access/ovokInternal'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'slug',
  },
  auth: {
    disableLocalStrategy: true,
    strategies: [ovokInternalStrategy],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => false,
  },
  fields: [
    {
      name: 'medplumProjectId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'The Medplum top-level Project UUID. Identifies the tenant.' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Human-readable code from src/tenant-code (Ovok backend).' },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'False when the project has disabled the CMS setting.' },
    },
  ],
  timestamps: true,
}
