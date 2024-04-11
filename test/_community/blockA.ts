import type { Block } from 'payload/dist/fields/config/types'

import { BlockB } from './blockB'

export const BlockA: Block = {
  slug: 'block-a',
  fields: [
    {
      name: 'nestedBlocks',
      type: 'blocks',
      blocks: [BlockB],
    },
    {
      name: 'title',
      type: 'text',
    },
  ],
  interfaceName: 'BlockA',
}
