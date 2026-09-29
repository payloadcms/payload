import type { Block, BlockSlug, Config, Field } from 'payload'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig, getPayload } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/memory/vitest.js'

// The no-cache regression uses about 350 MiB for this graph. This limit allows runtime variance.
const maximumHeapIncrease = 20 * 1024 * 1024

test('should initialize nested referenced blocks within the memory limit', async ({
  measureMemoryUsage,
}) => {
  const config = await buildConfig(createNestedBlocksConfig())
  const { memoryUsage, result: payload } = await measureMemoryUsage({
    run: () => getPayload({ config, disableDBConnect: true }),
  })

  await payload.destroy()

  expect(memoryUsage.heapUsed).toBeLessThan(maximumHeapIncrease)
})

const createNestedBlocksConfig = (): Config => {
  const { blocks, rootBlockSlugs } = createNestedBlocks()

  return {
    blocks,
    collections: [
      {
        slug: 'pages',
        fields: createReferencedBlockFields({ blockSlugs: rootBlockSlugs, count: 2 }),
      },
    ],
    db: mongooseAdapter({ url: false }),
    editor: lexicalEditor({}),
    logger: {
      options: {
        level: 'error',
      },
    },
    secret: 'mongodb-schema-memory-test',
    telemetry: false,
    typescript: {
      autoGenerate: false,
    },
  }
}

const createNestedBlocks = (): {
  blocks: Block[]
  rootBlockSlugs: BlockSlug[]
} => {
  const blocks: Block[] = []
  let childBlockSlugs: BlockSlug[] = []

  for (let layer = 5; layer >= 0; layer--) {
    const layerBlockSlugs = Array.from(
      { length: 4 },
      (_, blockIndex) => `nested-${layer}-${blockIndex}` as BlockSlug,
    )

    for (const [blockIndex, blockSlug] of layerBlockSlugs.entries()) {
      blocks.push({
        slug: blockSlug,
        fields:
          layer === 5
            ? [{ name: `text_${blockIndex}`, type: 'text' }]
            : [
                {
                  name: `children_${layer}_${blockIndex}`,
                  type: 'blocks',
                  blockReferences: childBlockSlugs,
                  blocks: [],
                },
              ],
      })
    }

    childBlockSlugs = layerBlockSlugs
  }

  return { blocks, rootBlockSlugs: childBlockSlugs }
}

const createReferencedBlockFields = ({
  blockSlugs,
  count,
}: {
  blockSlugs: BlockSlug[]
  count: number
}): Field[] =>
  Array.from({ length: count }, (_, index) => ({
    name: `layout_${index}`,
    type: 'blocks',
    blockReferences: blockSlugs,
    blocks: [],
  }))
