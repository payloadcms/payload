export default {
  slug: 'pages',
  label: 'Pages',
  singular: 'Page',
  plural: 'Pages',
  useAsTitle: 'title',
  fields: [
    {
      name: 'title',
      label: 'Page Title',
      type: 'input',
      maxLength: 100,
      required: true
    },
    {
      name: 'content',
      label: 'Content',
      type: 'textarea',
      height: 100,
      required: true
    },
    {
      name: 'categories',
      label: 'Categories',
      type: 'relationship',
      relationType: 'reference',
      relationTo: 'Category',
    },
    {
      name: 'slides',
      label: 'Slides',
      type: 'repeater',
      fields: [
        {
          name: 'content',
          type: 'textarea',
          label: 'Content'
        }
      ]
    },
    {
      label: 'Meta Information',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'input',
          maxLength: 100,
          label: 'Meta Title',
          width: 50
        },
        {
          name: 'metaKeywords',
          type: 'input',
          maxLength: 100,
          label: 'Meta Keywords',
          width: 50
        },
        {
          name: 'metaDesc',
          type: 'textarea',
          label: 'Meta Description',
          height: 100
        }
      ]
    }
  ]
};
