const Button = require('../client/components/richText/elements/Button');
const PurpleBackground = require('../client/components/richText/leaves/PurpleBackground');

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
          'h1',
          // 'h2',
          // 'h3',
          // 'blockquote',
          Button,
          'ul',
          'ol',
          'link',
        ],
        leaves: [
          'bold',
          'italic',
          PurpleBackground,
          // 'underline',
          // 'strikethrough',
        ],
      },
    },
  ],
};

module.exports = RichText;
