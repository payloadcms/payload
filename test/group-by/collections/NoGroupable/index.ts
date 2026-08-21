import type { CollectionConfig } from 'payload'

export const noGroupableSlug = 'no-groupable'

export const NoGroupableCollection: CollectionConfig = {
  slug: noGroupableSlug,
  // These must all be false to keep this fixture free of groupable fields:
  // auto timestamps add createdAt/updatedAt date fields, versions adds dated
  // fields, and authorship adds createdBy/updatedBy relationship fields.
  authorship: false,
  timestamps: false,
  versions: false,
  fields: [
    {
      name: 'json',
      type: 'json',
    },
  ],
}
