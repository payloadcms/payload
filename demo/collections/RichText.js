const Button = require('../client/components/richText/elements/Button').default;
const PurpleBackground = require('../client/components/richText/leaves/PurpleBackground').default;

const RichText = {
  slug: 'rich-text',
  labels: {
    singular: 'Rich Text',
    plural: 'Rich Texts',
  },
  fields: [
    {
      name: 'defaultRichText',
      type: 'richText',
      label: 'Default Rich Text',
      required: true,
    },
    {
      name: 'customRichText',
      type: 'richText',
      label: 'Customized Rich Text',
      required: true,
      admin: {
        elements: [
          'h2',
          'h3',
          Button,
        ],
        leaves: [
          'bold',
          PurpleBackground,
        ],
      },
    },
  ],
};

module.exports = RichText;
