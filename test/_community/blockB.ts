import type { Block } from 'payload/dist/fields/config/types'

import { BlockC } from './blockC'

export const BlockB: Block = {
  slug: 'block-b',
  fields: [
    {
      name: 'nestedBlocks',
      type: 'blocks',
      blocks: [BlockC],
    },
  ],
  interfaceName: 'BlockB',
}
