const ButtonToolbarButton = require('../client/components/richText/elements/Button/Button');
const ButtonElement = require('../client/components/richText/elements/Button/Element');
const StrikethroughButton = require('../client/components/richText/leaves/Strikethrough/Button');
const StrikethroughLeaf = require('../client/components/richText/leaves/Strikethrough/Leaf');

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
            button: ButtonToolbarButton,
            element: ButtonElement,
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
            button: StrikethroughButton,
            leaf: StrikethroughLeaf,
          },
        ],
      },
    },
  ],
};

module.exports = RichText;
