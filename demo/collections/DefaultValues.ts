import { CollectionConfig } from '../../src/collections/config/types';
import checkRole from '../access/checkRole';
import Email from '../blocks/Email';
import Quote from '../blocks/Quote';
import NumberBlock from '../blocks/Number';
import CallToAction from '../blocks/CallToAction';

const DefaultValues: CollectionConfig = {
  slug: 'default-values',
  labels: {
    singular: 'Default Value Test',
    plural: 'Default Value Tests',
  },
  admin: {
    useAsTitle: 'text',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      label: 'Text',
      defaultValue: 'Default Value',
      unique: true,
      access: {
        create: ({ req: { user } }) => checkRole(['admin'], user),
        update: ({ req: { user } }) => checkRole(['admin'], user),
        read: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: 'image',
      type: 'upload',
      label: 'Image',
      relationTo: 'media',
    },
    {
      name: 'select',
      label: 'Select',
      type: 'select',
      options: [{
        value: 'option-1',
        label: 'Option 1 Label',
      }, {
        value: 'option-2',
        label: 'Option 2 Label',
      }, {
        value: 'option-3',
        label: 'Option 3 Label',
      }, {
        value: 'option-4',
        label: 'Option 4 Label',
      }],
      defaultValue: 'option-1',
    },
    {
      name: 'selectMany',
      label: 'Select w/ hasMany',
      type: 'select',
      options: [{
        value: 'option-1',
        label: 'Option 1 Label',
      }, {
        value: 'option-2',
        label: 'Option 2 Label',
      }, {
        value: 'option-3',
        label: 'Option 3 Label',
      }, {
        value: 'option-4',
        label: 'Option 4 Label',
      }],
      defaultValue: ['option-1', 'option-4'],
      hasMany: true,
    },
    {
      name: 'radioGroupExample',
      label: 'Radio Group Example',
      type: 'radio',
      options: [{
        value: 'option-1',
        label: 'Options 1 Label',
      }, {
        value: 'option-2',
        label: 'Option 2 Label',
      }, {
        value: 'option-3',
        label: 'Option 3 Label',
      }],
      defaultValue: 'option-2',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          defaultValue: 'some@email.com',
        }, {
          name: 'number',
          label: 'Number',
          type: 'number',
          defaultValue: 5,
        },
      ],
    },
    {
      type: 'group',
      label: 'Group',
      name: 'group',
      defaultValue: {
        nestedText1: 'neat',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'nestedText1',
              label: 'Nested Text 1',
              type: 'text',
              defaultValue: 'nested default text 1',
            }, {
              name: 'nestedText2',
              label: 'Nested Text 2',
              type: 'text',
              defaultValue: 'nested default text 2',
            },
          ],
        },
      ],
    },
    {
      type: 'array',
      label: 'Array',
      name: 'array',
      admin: {
        readOnly: true,
      },
      defaultValue: [
        {
          arrayText1: 'Get out',
        },
      ],
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'arrayText1',
              label: 'Array Text 1',
              type: 'text',
              admin: {
                width: '50%',
              },
              defaultValue: 'default array text',
            },
            {
              name: 'arrayText2',
              label: 'Array Text 2',
              type: 'text',
              admin: {
                width: '50%',
              },
              access: {
                read: ({ req: { user } }) => Boolean(user),
                update: ({ req: { user } }) => checkRole(['admin'], user),
              },
            },
          ],
        },
        {
          type: 'text',
          name: 'arrayText3',
          label: 'Array Text 3',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'checkbox',
          label: 'Checkbox',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      type: 'blocks',
      label: 'Blocks Content',
      name: 'blocks',
      labels: {
        singular: 'Block',
        plural: 'Blocks',
      },
      blocks: [Email, NumberBlock, Quote, CallToAction],
      localized: true,
      admin: {
        readOnly: true,
      },
      defaultValue: [
        {
          blockType: 'email',
          testEmail: 'dev@payloadcms.com',
        },
      ],
    },
    {
      type: 'relationship',
      label: 'Relationship to One Collection',
      name: 'relationship',
      relationTo: 'conditions',
    },
    {
      type: 'relationship',
      label: 'Relationship hasMany',
      name: 'relationshipHasMany',
      relationTo: 'localized-posts',
      hasMany: true,
    },
    {
      type: 'relationship',
      label: 'Relationship to Multiple Collections',
      name: 'relationshipMultipleCollections',
      relationTo: ['localized-posts', 'conditions'],
    },
    {
      type: 'textarea',
      label: 'Textarea',
      name: 'textarea',
      defaultValue: 'my textarea text',
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      admin: {
        position: 'sidebar',
      },
      localized: true,
      unique: true,
      defaultValue: 'my-slug',
    },
    {
      name: 'checkbox',
      type: 'checkbox',
      label: 'Checkbox',
      admin: {
        position: 'sidebar',
      },
      defaultValue: true,
    },
    {
      name: 'richText',
      type: 'richText',
      label: 'Rich Text',
      admin: {
        elements: [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'blockquote',
          'ul',
          'ol',
          'link',
        ],
        leaves: [
          'bold',
          'italic',
          'underline',
          'strikethrough',
        ],
      },
      defaultValue: [{
        children: [{ text: 'Cookin now' }],
      }],
    },
  ],
  timestamps: true,
};
export default DefaultValues;
