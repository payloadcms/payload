import type { CollectionConfig } from '../../../../src/collections/config/types';
import { Block } from '../../../../src/fields/config/types';

const dummyBlock: Block = {
  slug: 'dummyBlock',
  fields: [
    {
      name: 'text',
      type: 'text',
    }
  ]
}

export const Blocks: CollectionConfig = {
  slug: 'blocks',
  fields: [
    {
      name: 'maxRows1',
      type: 'blocks',
      label: 'Max rows 1',
      maxRows: 1,
      blocks: [
        dummyBlock,
      ],
    },
    {
      name: 'maxRows3',
      type: 'blocks',
      label: 'Max rows 3',
      maxRows: 3,
      blocks: [
        dummyBlock,
      ],
    },
    {
      name: 'maxRows5',
      type: 'blocks',
      label: 'Max rows 5',
      maxRows: 5,
      blocks: [
        dummyBlock,
      ],
    },
  ],
};
