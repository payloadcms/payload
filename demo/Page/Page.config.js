export default {
  slug: 'pages',
  label: 'Pages',
  singular: 'Page',
  plural: 'Pages',
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'string',
      maxLength: 100
    },
    {
      name: 'content',
      label: 'Content',
      type: 'textarea'
    }
  ],
  relationships: [
    {
      relation: 'orders',
      type: 'hasMany'
    }
  ]
};
