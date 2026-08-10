import type { CollectionConfig } from 'payload'

export const noGroupableSlug = 'no-groupable'

export const NoGroupableCollection: CollectionConfig = {
  slug: noGroupableSlug,
  // Both must be false: auto timestamps add createdAt/updatedAt date fields,
  // and versions adds dated fields — all groupable, which would defeat this
  // fixture's purpose of having zero groupable fields.
  timestamps: false,
  versions: false,
  fields: [
    {
      name: 'json',
      type: 'json',
    },
  ],
}
