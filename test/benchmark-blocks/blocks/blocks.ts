import type { Block, BlocksField, BlockSlug } from 'payload'

export const generateBlocks = (
  blockCount: number,
  useReferences?: boolean,
): (Block | BlockSlug)[] => {
  const blocks: (Block | BlockSlug)[] = []

  for (let i = 0; i < blockCount; i++) {
    if (useReferences) {
      blocks.push(`block_${i}` as BlockSlug)
    } else {
      blocks.push({
        slug: `block_${i}`,
        fields: [
          {
            name: 'field1',
            type: 'text',
          },
          {
            name: 'field2',
            type: 'text',
          },
          {
            name: 'field3',
            type: 'text',
          },
          {
            name: 'field4',
            type: 'number',
          },
        ],
      })
    }
  }

  return blocks
}
export const generateBlockFields = (
  blockCount: number,
  containerCount: number,
  useReferences?: boolean,
): BlocksField[] => {
  const fields: BlocksField[] = []
  for (let i = 0; i < containerCount; i++) {
    const block: BlocksField = {
      name: `blocksfield_${i}`,
      type: 'blocks',
      blocks: [],
    }

    if (useReferences) {
      block.blockReferences = generateBlocks(blockCount, true)
    } else {
      block.blocks = generateBlocks(blockCount) as any
    }
    fields.push(block)
  }

  return fields
}
