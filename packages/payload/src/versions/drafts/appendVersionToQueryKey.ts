import type { Where } from '../../types/index.js'

const appendVersionToQueryKeyWithIDPath = (query: Where, idPath: string): Where => {
  return Object.entries(query).reduce((res, [key, val]) => {
    if (['AND', 'and', 'OR', 'or'].includes(key) && Array.isArray(val)) {
      return {
        ...res,
        [key.toLowerCase()]: val.map((subQuery) =>
          appendVersionToQueryKeyWithIDPath(subQuery, idPath),
        ),
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
      [idPath]: val,
    }
  }, {})
}

export const appendGlobalVersionToQueryKey = (query: Where = {}): Where =>
  appendVersionToQueryKeyWithIDPath(query, 'version.id')

export const appendVersionToQueryKey = (query: Where = {}): Where =>
  appendVersionToQueryKeyWithIDPath(query, 'parent')
