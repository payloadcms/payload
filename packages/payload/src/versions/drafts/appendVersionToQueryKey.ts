import type { Where } from '../../types/index.js'

const appendVersionToQueryKeyForEntity = ({
  entityType,
  query,
}: {
  entityType: 'collection' | 'global'
  query: Where
}): Where => {
  return Object.entries(query).reduce((res, [key, val]) => {
    if (['and', 'or'].includes(key.toLowerCase()) && Array.isArray(val)) {
      return {
        ...res,
        [key.toLowerCase()]: val.map((subQuery) =>
          appendVersionToQueryKeyForEntity({ entityType, query: subQuery }),
        ),
      }
    }

    if (key === 'id') {
      return entityType === 'collection'
        ? { ...res, parent: val }
        : { ...res, id: { exists: false } }
    }

    return {
      ...res,
      [`version.${key}`]: val,
    }
  }, {})
}

export const appendGlobalVersionToQueryKey = (query: Where = {}): Where =>
  appendVersionToQueryKeyForEntity({ entityType: 'global', query })

export const appendVersionToQueryKey = (query: Where = {}): Where =>
  appendVersionToQueryKeyForEntity({ entityType: 'collection', query })
