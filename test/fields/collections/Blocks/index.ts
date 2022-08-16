import type { CollectionConfig } from '../../../../src/collections/config/types';
import { Field } from '../../../../src/fields/config/types';

export const blocksField: Field = {
  name: 'blocks',
  type: 'blocks',
  required: true,
  blocks: [
    {
      slug: 'text',
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
    },
    {
      slug: 'number',
      fields: [
        {
          name: 'number',
          type: 'number',
          required: true,
        },
      ],
    },
    {
      slug: 'subBlocks',
      fields: [
        {
          type: 'collapsible',
          label: 'Collapsible within Block',
          fields: [
            {
              name: 'subBlocks',
              type: 'blocks',
              blocks: [
                {
                  slug: 'text',
                  fields: [
                    {
                      name: 'text',
                      type: 'text',
                      required: true,
                    },
                  ],
                },
                {
                  slug: 'number',
                  fields: [
                    {
                      name: 'number',
                      type: 'number',
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const BlockFields: CollectionConfig = {
  slug: 'block-fields',
  fields: [
    blocksField,
    {
      ...blocksField,
      name: 'localizedBlocks',
      localized: true,
    },
  ],
};

export const blocksFieldSeedData = [
  {
    blockName: 'First block',
    blockType: 'text',
    text: 'first block',
    richText: [],
  },
  {
    blockName: 'Second block',
    blockType: 'number',
    number: 342,
  },
  {
    blockName: 'Sub-block demonstration',
    blockType: 'subBlocks',
    subBlocks: [
      {
        blockName: 'First sub block',
        blockType: 'number',
        number: 123,
      },
      {
        blockName: 'Second sub block',
        blockType: 'text',
        text: 'second sub block',
      },
    ],
  },
] as const;

export const blocksDoc = {
  blocks: blocksFieldSeedData,
  localizedBlocks: blocksFieldSeedData,
};

export default BlockFields;
