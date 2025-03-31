import { deepMergeSimple } from '@payloadcms/translations/utilities'

import type { SelectType } from '../types/index.js'

import { getSelectMode } from './getSelectMode.js'

export const sanitizeSelect = ({
  forceSelect,
  select,
}: {
  forceSelect?: SelectType
  select?: SelectType
}): SelectType | undefined => {
  if (!forceSelect || !select) {
    return select
  }

  const selectMode = getSelectMode(select)

  if (selectMode === 'exclude') {
    return select
  }

  return deepMergeSimple(select, forceSelect)
}
