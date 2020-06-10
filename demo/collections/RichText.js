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
      disabledPlugins: [],
      disabledMarks: [],
      maxHeadingLevel: 1,
    },
  ],
};

module.exports = RichText;
