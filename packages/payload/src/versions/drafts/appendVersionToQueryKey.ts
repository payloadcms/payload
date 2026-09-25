import type { Where } from '../../types/index.js'

const appendVersionToQueryKeyWithIDPath = (query: Where, idPath?: string): Where => {
  return Object.entries(query).reduce((res, [key, val]) => {
    if (['and', 'or'].includes(key.toLowerCase()) && Array.isArray(val)) {
      return {
        ...res,
        [key.toLowerCase()]: val.map((subQuery) =>
          appendVersionToQueryKeyWithIDPath(subQuery, idPath),
        ),
      }
    }

    return {
      ...res,
      [key === 'id' && idPath ? idPath : `version.${key}`]: val,
    }
  }, {})
}

export const appendGlobalVersionToQueryKey = (query: Where = {}): Where =>
  appendVersionToQueryKeyWithIDPath(query)

export const appendVersionToQueryKey = (query: Where = {}): Where =>
  appendVersionToQueryKeyWithIDPath(query, 'parent')
