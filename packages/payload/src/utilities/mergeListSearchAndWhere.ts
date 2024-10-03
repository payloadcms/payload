import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { FieldAffectingData } from '../fields/config/types.js'
import type { Where } from '../types/index.js'

import { fieldAffectsData, fieldIsVirtual } from '../fields/config/types.js'
import { default as flattenTopLevelFields } from './flattenTopLevelFields.js'

const hoistQueryParamsToAnd = (where: Where, queryParams: Where) => {
  if ('and' in where) {
    where.and.push(queryParams)
  } else if ('or' in where) {
    where = {
      and: [where, queryParams],
    }
  } else {
    where = {
      and: [where, queryParams],
    }
  }

  return where
}

const getTitleField = (collection: SanitizedCollectionConfig): FieldAffectingData => {
  const {
    admin: { useAsTitle },
    fields,
  } = collection

  const topLevelFields = flattenTopLevelFields(fields)
  return topLevelFields.find(
    (field) => fieldAffectsData(field) && field.name === useAsTitle,
  ) as FieldAffectingData
}

type Args = {
  collectionConfig: SanitizedCollectionConfig
  query: {
    search?: string
    where?: Where
  }
}

export const mergeListSearchAndWhere = ({ collectionConfig, query }: Args): Where => {
  const search = query?.search || undefined
  let where = query?.where || undefined

  if (search) {
    let copyOfWhere = { ...(where || {}) }

    const titleField = getTitleField(collectionConfig)

    const titleFieldName = !titleField || fieldIsVirtual(titleField) ? 'id' : titleField.name

    const searchAsConditions = (
      collectionConfig.admin.listSearchableFields || [titleFieldName]
    ).map((fieldName) => {
      return {
        [fieldName]: {
          like: search,
        },
      }
    }, [])

    if (searchAsConditions.length > 0) {
      const conditionalSearchFields = {
        or: [...searchAsConditions],
      }
      copyOfWhere = hoistQueryParamsToAnd(copyOfWhere, conditionalSearchFields)
    }

    where = copyOfWhere
  }

  return where
}
