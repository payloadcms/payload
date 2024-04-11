import type { Block } from 'payload/dist/fields/config/types'

const Recurse = require('./blockA')

export const BlockC: Block = {
  slug: 'block-C',
  fields: [
    {
      name: 'nestedBlocks',
      type: 'blocks',
      blocks: [Recurse],
    },
  ],
  interfaceName: 'BlockC',
}
