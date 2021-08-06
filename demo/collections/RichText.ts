import Button from '../client/components/richText/elements/Button';
import PurpleBackground from '../client/components/richText/leaves/PurpleBackground';
import { CollectionConfig } from '../../src/collections/config/types';

const RichText: CollectionConfig = {
  slug: 'rich-text',
  labels: {
    singular: 'Rich Text',
    plural: 'Rich Texts',
  },
  access: {
    read: () => true,
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

export default RichText;
