import { CollectionConfig } from '../../src/collections/config/types';
import checkRole from '../access/checkRole';
import Email from '../blocks/Email';
import Quote from '../blocks/Quote';
import NumberBlock from '../blocks/Number';
import CallToAction from '../blocks/CallToAction';
import CollectionDescription from '../customComponents/CollectionDescription';

const AllFields: CollectionConfig = {
  slug: 'all-fields',
  labels: {
    singular: 'All Fields',
    plural: 'All Fields',
  },
  admin: {
    useAsTitle: 'text',
    preview: (doc, { token }) => {
      const { text } = doc;

      if (doc && text) {
        return `http://localhost:3000/previewable-posts/${text}?preview=true&token=${token}`;
      }

      return null;
    },
    description: CollectionDescription,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      label: 'Text',
      required: true,
      defaultValue: 'Default Value',
      unique: true,
      access: {
        create: ({ req: { user } }) => checkRole(['admin'], user),
        update: ({ req: { user } }) => checkRole(['admin'], user),
        read: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: 'descriptionText',
      type: 'text',
      label: 'Text with text description',
      defaultValue: 'Default Value',
      admin: {
        description: 'This text describes the field',
      },
    },
    {
      name: 'descriptionFunction',
      type: 'text',
      label: 'Text with function description',
      defaultValue: 'Default Value',
      maxLength: 20,
      admin: {
        description: ({ value }) => (typeof value === 'string' ? `${20 - value.length} characters left` : ''),
      },
    },
    {
      name: 'image',
      type: 'upload',
      label: 'Image',
      relationTo: 'media',
      admin: {
        description: 'No selfies',
      },
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
      required: true,
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
      defaultValue: 'option-1',
      required: true,
      hasMany: true,
    },
    {
      name: 'dayOnlyDateFieldExample',
      label: 'Day Only',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          monthsToShow: 2,
        },
      },
    },
    {
      name: 'timeOnlyDateFieldExample',
      label: 'Time Only',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'timeOnly',
        },
      },
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
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        }, {
          name: 'number',
          label: 'Number',
          type: 'number',
        },
      ],
    },
    {
      type: 'group',
      label: 'Group',
      name: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'nestedText1',
              label: 'Nested Text 1',
              type: 'text',
            }, {
              name: 'nestedText2',
              label: 'Nested Text 2',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      type: 'array',
      label: 'Array',
      name: 'array',
      minRows: 2,
      maxRows: 4,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'arrayText1',
              label: 'Array Text 1',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'arrayText2',
              label: 'Array Text 2',
              type: 'text',
              required: true,
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
        },
      ],
    },
    {
      type: 'blocks',
      label: 'Blocks Content',
      name: 'blocks',
      minRows: 2,
      blocks: [Email, NumberBlock, Quote, CallToAction],
      localized: true,
      required: true,
    },
    {
      type: 'relationship',
      label: 'Relationship to One Collection',
      name: 'relationship',
      relationTo: 'conditions',
      admin: {
        description: 'Relates to description',
      },
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
      admin: {
        description: 'Hello textarea description',
      },
    },
    {
      name: 'richText',
      type: 'richText',
      label: 'Rich Text',
      required: true,
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
      required: true,
    },
    {
      name: 'checkbox',
      type: 'checkbox',
      label: 'Checkbox',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'dateFieldExample',
      label: 'Day and Time',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          timeIntervals: 30,
        },
      },
    },
  ],
  timestamps: true,
};

export default AllFields;
