import type { Block } from '../fields/config/types.js'
import type {
  SelectExcludeType,
  SelectIncludeType,
  SelectMode,
  SelectType,
} from '../types/index.js'

/**
 * This is used for the Select API to determine the select level of a block.
 * It will ensure that `id` and `blockType` are always included in the select object.
 * @returns { blockSelect: boolean | SelectType, blockSelectMode: SelectMode }
 */
export const handleBlocksSelect = ({
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

    // sanitize `{ blocks: { cta: false }}` to `{ blocks: { cta: { id: true, blockType: true }}}`
    if (selectMode === 'exclude' && blocksSelect[block.slug] === false) {
      blockSelectMode = 'include'

      blocksSelect[block.slug] = {
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

        /**
         * @todo this type assertions here should not be required, as we're already typechecking in the if statement
         */
        ;(blocksSelect[block.slug] as SelectExcludeType | SelectIncludeType)['id'] = true
        ;(blocksSelect[block.slug] as SelectExcludeType | SelectIncludeType)['blockType'] = true
      }
    }

    return { blockSelect: blocksSelect?.[block.slug], blockSelectMode }
  }

  return { blockSelect: select, blockSelectMode: selectMode }
}
