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
    ).map((fieldName) => ({
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
