export default {
  slug: 'orders',
  label: 'Orders',
  singular: 'Order',
  plural: 'Orders',
  fields: [
    {
      name: 'metaInfo',
      type: 'group',
      fields: {
        title: {
          type: 'string',
          maxLength: 100
        },
        description: { type: 'textarea',
          wysiwyg: false,
          height: 100
        },
        keywords: { type: 'text' }
      }
    },
    {
      name: 'content',
      type: 'group',
      fields: [
        {
          name: 'exampleField1',
          type: 'textarea',
          wysiwyg: true,
          height: 400
        },
        {
          name: 'flexibleContentExample',
          type: 'flex',
          availableLayouts: [
            'layout1',
            'layout5'
          ]
        }
      ]
    }
  ]
};
