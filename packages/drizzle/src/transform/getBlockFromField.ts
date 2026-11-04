import type { FlattenedBlock, FlattenedBlocksField } from 'payload'

import type { DrizzleAdapter } from '../types.js'

export const getBlockFromField = ({
  adapter,
  blockType,
  field,
}: {
  adapter: DrizzleAdapter
  blockType: string
  field: FlattenedBlocksField
}): FlattenedBlock | undefined => {
  const block = (field.blockReferences ?? field.blocks).find((block) =>
    typeof block === 'string' ? block === blockType : block.slug === blockType,
  )

  return typeof block === 'string' ? adapter.payload.blocks[block] : block
}
