export default {
  slug: 'email',
  labels: {
    singular: 'Email',
    plural: 'Emails',
  },
  fields: [
    {
      name: 'testEmail',
      label: 'Test Email Field',
      type: 'email',
      maxLength: 100,
      required: true,
    },
  ],
};
