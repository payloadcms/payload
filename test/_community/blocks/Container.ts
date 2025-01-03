import type { Block } from 'payload'

import { blockOptions } from './blockOptions.js'
import { generateHeroBlocks } from './Hero.js'

const Container: (index: number) => Block = (index) => ({
  slug: `Container${index}`,
  interfaceName: `Container${index}Block`,
  fields: [
    {
      name: 'blocks',
      type: 'blocks',
      blocks: generateHeroBlocks(50),
    },
    blockOptions,
  ],
})

export const generateContainerBlocks = (count: number) =>
  Array.from({ length: count }).map((_, index) => Container(index + 1))
