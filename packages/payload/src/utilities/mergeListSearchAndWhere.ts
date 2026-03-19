import type { ClientCollectionConfig } from '../collections/config/client.js'
import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Where } from '../types/index.js'

const isEmptyObject = (obj: object) => Object.keys(obj).length === 0

export const hoistQueryParamsToAnd = (currentWhere: Where, incomingWhere: Where) => {
  if (isEmptyObject(incomingWhere)) {
    return currentWhere
  }

  if (isEmptyObject(currentWhere)) {
    return incomingWhere
  }

  if ('and' in currentWhere && currentWhere.and) {
    currentWhere.and.push(incomingWhere)
  } else if ('or' in currentWhere) {
    currentWhere = {
      and: [currentWhere, incomingWhere],
    }
  } else {
    currentWhere = {
      and: [currentWhere, incomingWhere],
    }
  }

  return currentWhere
}

type Args = {
  collectionConfig: ClientCollectionConfig | SanitizedCollectionConfig
  search: string
  where?: Where
}

export const mergeListSearchAndWhere = ({ collectionConfig, search, where = {} }: Args): Where => {
  if (search) {
    let copyOfWhere = { ...(where || {}) }

    const searchAsConditions = (
      collectionConfig.admin.listSearchableFields || [collectionConfig.admin?.useAsTitle || 'id']
    )
      .filter((fieldName) => {
        if (fieldName === 'id') {
          const trimmed = search.trim()
          const isNumeric = /^\d+$/.test(trimmed)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)
          return isNumeric || isUUID
        }
        return true
      })
      .map((fieldName) => ({
        [fieldName]: {
          like: search,
        },
      }))

    if (searchAsConditions.length > 0) {
      copyOfWhere = hoistQueryParamsToAnd(copyOfWhere, {
        or: searchAsConditions,
      })
    }

    if (!isEmptyObject(copyOfWhere)) {
      where = copyOfWhere
    }
  }

  return where
}
