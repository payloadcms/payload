import type { Where } from '../../types'

export const appendVersionToQueryKey = (query: Where): Where => {
  return Object.entries(query).reduce((res, [key, val]) => {
    if (['AND', 'OR', 'and', 'or'].includes(key) && Array.isArray(val)) {
      return {
        ...res,
        [key.toLowerCase()]: val.map((subQuery) => appendVersionToQueryKey(subQuery)),
      }
    }

    if (key !== 'id') {
      return {
        ...res,
        [`version.${key}`]: val,
      }
    }

    return {
      ...res,
      parent: val,
    }
  }, {})
}
