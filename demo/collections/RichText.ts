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
                  type: 'text',
                  name: 'altText',
                  label: 'Alt Text',
                },
                {
                  type: 'textarea',
                  name: 'caption',
                  label: 'Caption',
                },
                {
                  type: 'group',
                  name: 'meta',
                  fields: [
                    {
                      type: 'select',
                      name: 'alignment',
                      label: 'Alignment',
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
                    {
                      type: 'relationship',
                      relationTo: 'admins',
                      name: 'author',
                    },
                  ],
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
