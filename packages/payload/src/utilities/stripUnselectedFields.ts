import type { Data } from '../admin/types.js'
import type { Block, Field, TabAsField } from '../fields/config/types.js'
import type { SelectMode, SelectType } from '../types/index.js'

import { fieldAffectsData } from '../fields/config/types.js'

export const stripUnselectedFields = ({
  field,
  select,
  selectMode,
  siblingDoc,
}: {
  field: Field | TabAsField
  select: SelectType
  selectMode: SelectMode
  siblingDoc: Data
}): boolean => {
  let shouldContinue = true

  if (fieldAffectsData(field) && select && selectMode) {
    if (selectMode === 'include') {
      if (!select[field.name]) {
        delete siblingDoc[field.name]
        shouldContinue = false
      }
    }

    if (selectMode === 'exclude') {
      if (select[field.name] === false) {
        delete siblingDoc[field.name]
        shouldContinue = false
      }
    }
  }

  return shouldContinue
}

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
