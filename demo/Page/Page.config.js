export default {
  slug: 'pages',
  label: 'Pages',
  singular: 'Page',
  plural: 'Pages',
  uid: 'title',
  fields: [
    {
      name: 'title',
      label: 'Page Title',
      type: 'string',
      maxLength: 100
    },
    {
      name: 'content',
      label: 'Content',
      type: 'textarea',
      height: 100
    },
    {
      label: 'Meta Information',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'string',
          maxLength: 100,
          label: 'Meta Title'
        },
        {
          name: 'metaDesc',
          type: 'textarea',
          label: 'Meta Description',
          height: 100
        }
      ]
    }
  ],
  relationships: [
    {
      relation: 'orders',
      type: 'hasMany'
    }
  ]
};
