import checkRole from '../access/checkRole';

export default {
  slug: 'navigation-array',
  label: 'Navigation Array',
  access: {
    update: ({ req: { user } }) => checkRole(['admin', 'user'], user),
    read: () => true,
  },
  fields: [
    {
      name: 'array',
      label: 'Array',
      type: 'array',
      localized: true,
      fields: [{
        name: 'text',
        label: 'Text',
        type: 'text',
      }, {
        name: 'textarea',
        label: 'Textarea',
        type: 'textarea',
      }],
    },
  ],
};
