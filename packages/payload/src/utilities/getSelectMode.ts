import type { SelectMode, SelectType } from '../types/index.js'

export const getSelectMode = (select: SelectType): SelectMode => {
  for (const key in select) {
    const selectValue = select[key]
    if (selectValue === false) {
      return 'exclude'
    }

    if (typeof selectValue === 'object') {
      return getSelectMode(selectValue)
    }
  }

  return 'include'
}
