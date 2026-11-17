import type { PayloadRequest } from '../types/index.js'
import type { Block, BlocksField } from './config/types.js'

export const getBlockFromField = ({
  blockType,
  field,
  req,
}: {
  blockType: string
  field: BlocksField
  req: PayloadRequest
}): Block | undefined => {
  const block = (field.blockReferences ?? field.blocks).find((block) =>
    typeof block === 'string' ? block === blockType : block.slug === blockType,
  )

  return typeof block === 'string' ? req.payload.blocks[block] : block
}
