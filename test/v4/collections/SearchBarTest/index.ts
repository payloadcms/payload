import type { CollectionConfig } from 'payload'

const SearchBarTest: CollectionConfig = {
  slug: 'search-bar-test',
  admin: {
    useAsTitle: 'title',
    groupBy: {
      fields: ['category', 'status'],
    },
    listSearchableFields: ['title', 'description'],
    components: {
      afterList: ['./collections/SearchBarTest/AfterList.js#AfterList'],
    },
  },
  enableQueryPresets: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'News', value: 'news' },
        { label: 'Blog', value: 'blog' },
        { label: 'Tutorial', value: 'tutorial' },
        { label: 'Documentation', value: 'docs' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
    },
    {
      name: 'priority',
      type: 'number',
    },
  ],
}

export default SearchBarTest
