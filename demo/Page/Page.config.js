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
