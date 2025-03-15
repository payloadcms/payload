import type { Block } from '../fields/config/types.js'
import type { SelectMode, SelectType } from '../types/index.js'

/**
 * This is used for the Select API to determine the select level of a block.
 * It will ensure that `id` and `blockType` are always included in the select object.
 * @returns { blockSelect: boolean | SelectType, blockSelectMode: SelectMode }
 */
export const getBlockSelect = ({
  block,
  select,
  selectMode,
}: {
  block: Block
  select: SelectType[string]
  selectMode: SelectMode
}): { blockSelect: boolean | SelectType; blockSelectMode: SelectMode } => {
  if (typeof select === 'object') {
    let blockSelectMode = selectMode

    const blocksSelect = {
      ...select,
    }

    let blockSelect = blocksSelect[block.slug]

    // sanitize `{ blocks: { cta: false }}` to `{ blocks: { cta: { id: true, blockType: true }}}`
    if (selectMode === 'exclude' && blockSelect === false) {
      blockSelectMode = 'include'

      blockSelect = {
        id: true,
        blockType: true,
      }
    } else if (selectMode === 'include') {
      if (!blockSelect) {
        blockSelect = {}
      }

      if (typeof blockSelect === 'object') {
        blockSelect = {
          ...blockSelect,
        }

        blockSelect['id'] = true
        blockSelect['blockType'] = true
      }
    }

    return { blockSelect, blockSelectMode }
  }

  return { blockSelect: select, blockSelectMode: selectMode }
}
