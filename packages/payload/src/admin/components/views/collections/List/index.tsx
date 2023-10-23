import queryString from 'qs'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { v4 as uuid } from 'uuid'

import type { Where } from '../../../../../exports/types'
import type { ListIndexProps, ListPreferences, Props } from './types'

import { type Field } from '../../../../../fields/config/types'
import usePayloadAPI from '../../../../hooks/usePayloadAPI'
import { useUseTitleField } from '../../../../hooks/useUseAsTitle'
import { useStepNav } from '../../../elements/StepNav'
import { TableColumnsProvider } from '../../../elements/TableColumns'
import { useAuth } from '../../../utilities/Auth'
import { useConfig } from '../../../utilities/Config'
import { usePreferences } from '../../../utilities/Preferences'
import RenderCustomComponent from '../../../utilities/RenderCustomComponent'
import { useSearchParams } from '../../../utilities/SearchParams'
import DefaultList from './Default'
import formatFields from './formatFields'

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

/**
 * The ListView component is table which lists the collection's documents.
 * The default list view can be found at the {@link DefaultList} component.
 * Users can also create pass their own custom list view component instead
 * of using the default one.
 */
const ListView: React.FC<ListIndexProps> = (props) => {
  const {
    collection,
    collection: {
      admin: {
        components: { views: { List: CustomList } = {} } = {},
        listSearchableFields,
        pagination: { defaultLimit },
      },
      labels: { plural },
      slug,
    },
  } = props

  const {
    routes: { admin, api },
    serverURL,
  } = useConfig()
  const preferenceKey = `${collection.slug}-list`
  const { permissions } = useAuth()
  const { setStepNav } = useStepNav()
  const { getPreference, setPreference } = usePreferences()
  const { limit, page, search, sort, where } = useSearchParams()
  const history = useHistory()
  const { t } = useTranslation('general')
  const [fetchURL, setFetchURL] = useState<string>('')
  const [fields] = useState<Field[]>(() => formatFields(collection))
  const collectionPermissions = permissions?.collections?.[slug]
  const hasCreatePermission = collectionPermissions?.create?.permission
  const newDocumentURL = `${admin}/collections/${slug}/create`
  const [{ data }, { setParams }] = usePayloadAPI(fetchURL, { initialParams: { page: 1 } })
  const titleField = useUseTitleField(collection)

  useEffect(() => {
    setStepNav([
      {
        label: plural,
      },
    ])
  }, [setStepNav, plural])

  // /////////////////////////////////////
  // Set up Payload REST API query params
  // /////////////////////////////////////

  const resetParams = useCallback<Props['resetParams']>(
    (overrides = {}) => {
      const params: Record<string, unknown> & { where?: Where } = {
        depth: 0,
        draft: 'true',
        limit,
        page: overrides?.page,
        search: overrides?.search,
        sort: overrides?.sort,
        where: overrides?.where || {},
      }

      if (page) params.page = page
      if (sort) params.sort = sort
      if (where) params.where = where as Where
      params.invoke = uuid()

      if (search) {
        let copyOfWhere = { ...((where as Where) || {}) }

        const searchAsConditions = (listSearchableFields || [titleField?.name]).map((fieldName) => {
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

        params.where = copyOfWhere
      }

      setParams(params)
    },
    [limit, page, setParams, sort, where, search, listSearchableFields, titleField?.name],
  )

  useEffect(() => {
    // Performance enhancement
    // Setting the Fetch URL this way
    // prevents a double-fetch
    setFetchURL(`${serverURL}${api}/${slug}`)
    resetParams()
  }, [api, resetParams, serverURL, slug])

  // /////////////////////////////////////
  // Fetch preferences on first load
  // /////////////////////////////////////

  useEffect(() => {
    ;(async () => {
      const currentPreferences = await getPreference<ListPreferences>(preferenceKey)

      const params = queryString.parse(history.location.search, {
        depth: 0,
        ignoreQueryPrefix: true,
      })

      const search = {
        ...params,
        limit: params?.limit || currentPreferences?.limit || defaultLimit,
        sort: params?.sort || currentPreferences?.sort,
      }

      const newSearchQuery = queryString.stringify(search, { addQueryPrefix: true })

      if (newSearchQuery.length > 1) {
        history.replace({
          search: newSearchQuery,
        })
      }
    })()
  }, [collection, getPreference, preferenceKey, history, t, defaultLimit])

  // /////////////////////////////////////
  // Set preferences on change
  // /////////////////////////////////////

  useEffect(() => {
    ;(async () => {
      const currentPreferences = await getPreference<ListPreferences>(preferenceKey)

      const newPreferences = {
        ...currentPreferences,
        limit,
        sort,
      }

      setPreference(preferenceKey, newPreferences)
    })()
  }, [sort, limit, preferenceKey, setPreference, getPreference])

  // /////////////////////////////////////
  // Prevent going beyond page limit
  // /////////////////////////////////////

  useEffect(() => {
    if (data?.totalDocs && data.pagingCounter > data.totalDocs) {
      const params = queryString.parse(history.location.search, {
        depth: 0,
        ignoreQueryPrefix: true,
      })
      const newSearchQuery = queryString.stringify(
        {
          ...params,
          page: data.totalPages,
        },
        { addQueryPrefix: true },
      )
      history.replace({
        search: newSearchQuery,
      })
    }
  }, [data, history, resetParams])

  return (
    <TableColumnsProvider collection={collection}>
      <RenderCustomComponent
        CustomComponent={CustomList}
        DefaultComponent={DefaultList}
        componentProps={{
          collection: { ...collection, fields },
          data,
          hasCreatePermission,
          limit: limit || defaultLimit,
          newDocumentURL,
          resetParams,
          titleField,
        }}
      />
    </TableColumnsProvider>
  )
}

export default ListView
