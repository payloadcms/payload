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
};

const BlockFields: CollectionConfig = {
  slug: 'block-fields',
  fields: [
    blocksField,
  ],
};

export const blocksFieldSeedData = [
  {
    blockName: 'First block',
    blockType: 'text',
    text: 'first block',
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
];

export const blocksDoc = {
  blocks: blocksFieldSeedData,
};

export default BlockFields;
