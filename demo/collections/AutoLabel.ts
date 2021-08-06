import { CollectionConfig } from '../../src/collections/config/types';

const AutoLabel: CollectionConfig = {
  slug: 'auto-label',
  admin: {
    useAsTitle: 'autoLabelField',
    enableRichTextRelationship: true,
  },
  fields: [
    {
      name: 'autoLabelField',
      type: 'text',
    },
    {
      name: 'noLabel',
      type: 'text',
      label: false,
    },
    {
      name: 'labelOverride',
      type: 'text',
      label: 'Custom Label',
    },
    {
      name: 'testRelationship',
      type: 'relationship',
      relationTo: 'all-fields',
    },
    {
      name: 'specialBlock',
      type: 'blocks',
      minRows: 1,
      maxRows: 20,
      // Will auto-label
      // labels: {
      //   singular: 'Special Block',
      //   plural: 'Special Blocks',
      // },
      blocks: [
        {
          slug: 'number',
          // Will auto-label
          // labels: {
          //   singular: 'Number',
          //   plural: 'Numbers',
          // },
          fields: [
            {
              name: 'testNumber',
              type: 'number',
            },
          ],
        },
      ],
    },
    {
      name: 'noLabelBlock',
      type: 'blocks',
      label: false,
      minRows: 1,
      maxRows: 20,
      blocks: [
        {
          slug: 'number',
          // labels: {
          //   singular: 'Number',
          //   plural: 'Numbers',
          // },
          fields: [
            {
              name: 'testNumber',
              type: 'number',
            },
          ],
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'itemName',
          type: 'text',
        },
      ],
    },
    {
      name: 'noLabelArray',
      type: 'array',
      label: false,
      fields: [
        {
          type: 'text',
          name: 'textField',
        },
      ],
    },
  ],
};

export default AutoLabel;
