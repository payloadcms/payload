import type { Block } from 'payload'

import { blockOptions } from './blockOptions.js'
import { generateHeroBlocks } from './Hero.js'

const Container: (index: number, blockCount: number) => Block = (index, blockCount) => ({
  slug: `Container${index}`,
  interfaceName: `Container${index}Block`,
  fields: [
    {
      name: 'blocks',
      type: 'blocks',
      blocks: generateHeroBlocks(blockCount),
    },
    blockOptions,
  ],
})

export const generateContainerBlocks = (count: number, blockCount: number) =>
  Array.from({ length: count }).map((_, index) => Container(index + 1, blockCount))
