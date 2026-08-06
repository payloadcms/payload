import type { CollectionConfig } from 'payload'

export const filterOptionsThrowsSlug = 'filter-options-throws'

export const FilterOptionsThrowsCollection: CollectionConfig = {
  slug: filterOptionsThrowsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'selectWithThrowingFilterOptions',
      type: 'select',
      filterOptions: () => {
        throw new Error('Intentional error thrown by filterOptions for testing purposes')
      },
      options: ['allowed', 'excluded'],
    },
    {
      name: 'relationshipWithThrowingFilterOptions',
      type: 'relationship',
      filterOptions: () => {
        throw new Error('Intentional error thrown by filterOptions for testing purposes')
      },
      relationTo: filterOptionsThrowsSlug,
    },
    {
      name: 'blocksWithThrowingFilterOptions',
      type: 'blocks',
      blocks: [
        {
          slug: 'textBlock',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
      ],
      filterOptions: () => {
        throw new Error('Intentional error thrown by filterOptions for testing purposes')
      },
    },
  ],
  versions: false,
}
