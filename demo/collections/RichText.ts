import Button from '../client/components/richText/elements/Button';
import PurpleBackground from '../client/components/richText/leaves/PurpleBackground';
import { PayloadCollectionConfig } from '../../src/collections/config/types';

const RichText: PayloadCollectionConfig = {
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
    {
      name: 'editablePropsRichText',
      type: 'richText',
      label: 'Rich Text with Editable props',
      required: true,
      admin: {
        editableProps: {
          onClick: (e) => console.log('Clicked RichText', e),
          style: {
            color: 'rebeccapurple',
          },
        },
      }
    },
  ],
};

export default RichText;
