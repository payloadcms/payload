import type { Block } from '../fields/config/types.js'
import type { SelectMode, SelectType } from '../types/index.js'

export const handleBlocksSelect = ({
  block,
  select,
  selectMode,
}: {
  block: Block
  select: boolean | SelectType
  selectMode: SelectMode
}): { blockSelect: SelectType; blockSelectMode: SelectMode } => {
  let blocksSelect = select
  let blockSelectMode = selectMode

  if (typeof select === 'object') {
    blocksSelect = {
      ...select,
    }

    // sanitize blocks: {cta: false} to blocks: {cta: {id: true, blockType: true}}
    if (selectMode === 'exclude' && blocksSelect[block.slug] === false) {
      blockSelectMode = 'include'

      select[block.slug] = {
        id: true,
        blockType: true,
      }
    } else if (selectMode === 'include') {
      if (!blocksSelect[block.slug]) {
        blocksSelect[block.slug] = {}
      }

      if (typeof blocksSelect[block.slug] === 'object') {
        blocksSelect[block.slug] = {
          ...(blocksSelect[block.slug] as object),
        }

        blocksSelect[block.slug]['id'] = true
        blocksSelect[block.slug]['blockType'] = true
      }
    }
  }

  return { blockSelect: blocksSelect?.[block.slug], blockSelectMode }
}
