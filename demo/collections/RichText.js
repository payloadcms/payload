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
      admin: {
        elements: [
          // 'h1',
          // 'h2',
          // 'h3',
          {
            name: 'button',
            button: 'client/components/richText/elements/Button/Button',
            element: 'client/components/richText/elements/Button/Element',
          },
          // 'blockquote',
          'ul',
          'ol',
        ],
        leaves: [
          'bold',
          'italic',
          {
            name: 'strikethrough',
            button: 'client/components/richText/leaves/Strikethrough/Button',
            leaf: 'client/components/richText/leaves/Strikethrough/Leaf',
          },
        ],
      },
    },
  ],
};

module.exports = RichText;
