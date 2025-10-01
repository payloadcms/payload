import type { CollectionConfig } from 'payload'

export const listViewSelectAPISlug = 'list-view-select-api'

export const ListViewSelectAPI: CollectionConfig = {
  slug: listViewSelectAPISlug,
  admin: {
    enableListViewSelectAPI: true,
    components: {
      beforeListTable: [
        './collections/ListViewSelectAPI/BeforeListTable/index.tsx#BeforeListTable',
      ],
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'groupNameField',
          type: 'text',
        },
      ],
    },
  ],
}
