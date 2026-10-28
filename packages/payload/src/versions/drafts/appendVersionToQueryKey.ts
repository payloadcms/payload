import type { Where } from '../../types/index.js'

const appendVersionToQueryKeyWithIDPath = (query: Where, idPath?: false | string): Where => {
  return Object.entries(query).reduce((res, [key, val]) => {
    if (['and', 'or'].includes(key.toLowerCase()) && Array.isArray(val)) {
      return {
        ...res,
        [key.toLowerCase()]: val.map((subQuery) =>
          appendVersionToQueryKeyWithIDPath(subQuery, idPath),
        ),
      }
    }

    if (key === 'id' && idPath === false) {
      return {
        ...res,
        id: { exists: false },
      }
    }

    return {
      ...res,
      [key === 'id' && idPath ? idPath : `version.${key}`]: val,
    }
  }, {})
}

export const appendGlobalVersionToQueryKey = (query: Where = {}): Where =>
  appendVersionToQueryKeyWithIDPath(query, false)

export const appendVersionToQueryKey = (query: Where = {}): Where =>
  appendVersionToQueryKeyWithIDPath(query, 'parent')
