const RichText = {
  slug: 'rich-text',
  labels: {
    singular: 'Rich Text',
    plural: 'Rich Texts',
  },
  fields: [
    {
      name: 'richText',
      type: 'richText',
      label: 'Rich Text',
      required: true,
      disabledElements: [],
      disabledMarks: [],
    },
  ],
};

module.exports = RichText;
