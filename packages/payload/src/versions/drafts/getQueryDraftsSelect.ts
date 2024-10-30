import type { SelectType } from '../../types/index.js'

import { getSelectMode } from '../../utilities/getSelectMode.js'

export const getQueryDraftsSelect = ({
  select,
}: {
  select?: SelectType
}): SelectType | undefined => {
  if (!select) {
    return
  }

  const mode = getSelectMode(select)

  if (mode === 'include') {
    return {
      parent: true,
      version: select,
    } as SelectType
  }

  return {
    version: select,
  } as SelectType
}
