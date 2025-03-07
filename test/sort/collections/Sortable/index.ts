import type { CollectionConfig } from 'payload'

export const sortableSlug = 'sortable'

export const SortableCollection: CollectionConfig = {
  slug: sortableSlug,
  isSortable: true,
  admin: {
    useAsTitle: 'title',
    components: {
      beforeList: ['/Seed.tsx#Seed'],
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
