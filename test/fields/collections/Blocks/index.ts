import type { CollectionConfig } from '../../../../src/collections/config/types';

const BlockFields: CollectionConfig = {
  slug: 'block-fields',
  fields: [
    {
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
    },
  ],
};

export const blocksDoc = {
  blocks: [
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
  ],
};

export default BlockFields;
