import type { I18nClient } from '@payloadcms/translations'

import { getTranslation } from '@payloadcms/translations'

import type { ClientCollectionConfig } from '../collections/config/client.js'
import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { ClientField, Field, SelectField, SelectFieldClient } from '../fields/config/types.js'
import type { Where } from '../types/index.js'

import { flattenTopLevelFields } from './flattenTopLevelFields.js'

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
  /** Enables select option label matching in the current admin language. */
  i18n?: I18nClient
  search: string
  where?: Where
}

export const mergeListSearchAndWhere = ({
  collectionConfig,
  i18n,
  search,
  where = {},
}: Args): Where => {
  if (search) {
    let copyOfWhere = { ...(where || {}) }

    const searchAsConditions = (
      collectionConfig.admin.listSearchableFields || [collectionConfig.admin?.useAsTitle || 'id']
    ).flatMap((fieldName): Where[] => {
      const conditions: Where[] = [{ [fieldName]: { like: search } }]
      const field = i18n
        ? getSearchField({ fields: collectionConfig.fields, path: fieldName })
        : undefined

      if (i18n && field?.type === 'select') {
        const normalizedSearch = search.toLowerCase().trim()
        const matchingValues = field.options.flatMap((option) => {
          if (typeof option === 'string') {
            return []
          }

          const label = getTranslation(option.label, i18n)

          return normalizedSearch &&
            typeof label === 'string' &&
            label.toLowerCase().includes(normalizedSearch)
            ? [option.value]
            : []
        })

        if (matchingValues.length > 0) {
          conditions.push({ [fieldName]: { in: matchingValues } })
        }
      }

      return conditions
    })

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

const getSearchField = ({
  fields,
  path,
}: {
  fields: (ClientField | Field)[]
  path: string
}): SelectField | SelectFieldClient | undefined => {
  const [name, ...remainingPath] = path.split('.')
  const field = flattenTopLevelFields(fields).find((field) => field.name === name)

  if (remainingPath.length === 0) {
    return field?.type === 'select' ? field : undefined
  }

  if (field && 'fields' in field) {
    return getSearchField({ fields: field.fields, path: remainingPath.join('.') })
  }

  return undefined
}
