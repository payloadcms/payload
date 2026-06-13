import type { Block } from 'payload'

import { generateContainerBlocks } from './Container.js'
import { generateHeroBlocks } from './Hero.js'

export const generateBlocks = (blockCount: number, containerCount?: number): Block[] => [
  ...generateHeroBlocks(blockCount),
  ...(containerCount && containerCount > 0
    ? generateContainerBlocks(containerCount, blockCount)
    : []),
]
