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
      admin: {
        upload: {
          collections: {
            media: {
              fields: [
                {
                  type: 'textarea',
                  name: 'caption',
                  label: 'Caption',
                },
                {
                  type: 'row',
                  fields: [
                    {
                      type: 'relationship',
                      relationTo: 'admins',
                      name: 'linkToAdmin',
                      label: 'Link to Admin',
                    },
                    {
                      type: 'select',
                      name: 'imageAlignment',
                      label: 'Image Alignment',
                      options: [
                        {
                          label: 'Left',
                          value: 'left',
                        },
                        {
                          label: 'Center',
                          value: 'center',
                        },
                        {
                          label: 'Right',
                          value: 'right',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'checkbox',
                  name: 'wrapText',
                  label: 'Wrap Text',
                },
              ],
            },
          },
        },
      },
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
