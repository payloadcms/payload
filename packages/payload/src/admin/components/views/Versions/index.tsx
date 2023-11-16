import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { IndexProps } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import usePayloadAPI from '../../../hooks/usePayloadAPI'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { EditDepthContext } from '../../utilities/EditDepth'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import { useSearchParams } from '../../utilities/SearchParams'
import { DefaultVersionsView } from './Default'

const VersionsView: React.FC<IndexProps> = (props) => {
  const { id, collection, global } = props

  const { permissions, user } = useAuth()

  const [fetchURL, setFetchURL] = useState('')

  const {
    routes: { admin, api },
    serverURL,
  } = useConfig()

  const { i18n } = useTranslation('version')

  const { limit, page, sort } = useSearchParams()

  let CustomVersionsView: React.ComponentType | null = null
  let docURL: string
  let entityLabel: string
  let slug: string
  let editURL: string

  if (collection) {
    ;({ slug } = collection)
    docURL = `${serverURL}${api}/${slug}/${id}`
    entityLabel = getTranslation(collection.labels.singular, i18n)
    editURL = `${admin}/collections/${collection.slug}/${id}`

    // The component definition could come from multiple places in the config
    // we need to cascade into the proper component from the top-down
    // 1. "components.Edit"
    // 2. "components.Edit.Versions"
    // 3. "components.Edit.Versions.Component"
    const Edit = collection?.admin?.components?.views?.Edit

    CustomVersionsView =
      typeof Edit === 'function'
        ? Edit
        : typeof Edit === 'object' && typeof Edit.Versions === 'function'
        ? Edit.Versions
        : typeof Edit?.Versions === 'object' &&
          'Component' in Edit.Versions &&
          typeof Edit.Versions.Component === 'function'
        ? Edit.Versions.Component
        : undefined
  }

  if (global) {
    ;({ slug } = global)
    docURL = `${serverURL}${api}/globals/${slug}`
    entityLabel = getTranslation(global.label, i18n)
    editURL = `${admin}/globals/${global.slug}`

    // See note above about cascading component definitions
    const Edit = global?.admin?.components?.views?.Edit

    CustomVersionsView =
      typeof Edit === 'function'
        ? Edit
        : typeof Edit === 'object' && typeof Edit.Versions === 'function'
        ? Edit.Versions
        : typeof Edit?.Versions === 'object' &&
          'Component' in Edit.Versions &&
          typeof Edit.Versions.Component === 'function'
        ? Edit.Versions.Component
        : undefined
  }

  const [{ data, isLoading }] = usePayloadAPI(docURL, { initialParams: { draft: 'true' } })
  const [{ data: versionsData, isLoading: isLoadingVersions }, { setParams }] =
    usePayloadAPI(fetchURL)

  useEffect(() => {
    const params = {
      depth: 1,
      limit,
      page: undefined,
      sort: undefined,
      where: {},
    }

    if (page) params.page = page
    if (sort) params.sort = sort

    let fetchURLToSet: string

    if (collection) {
      fetchURLToSet = `${serverURL}${api}/${collection.slug}/versions`
      params.where = {
        parent: {
          equals: id,
        },
      }
    }

    if (global) {
      fetchURLToSet = `${serverURL}${api}/globals/${global.slug}/versions`
    }

    // Performance enhancement
    // Setting the Fetch URL this way
    // prevents a double-fetch

    setFetchURL(fetchURLToSet)

    setParams(params)
  }, [setParams, page, sort, limit, serverURL, api, id, global, collection])

  return (
    <EditDepthContext.Provider value={1}>
      <RenderCustomComponent
        CustomComponent={CustomVersionsView}
        DefaultComponent={DefaultVersionsView}
        componentProps={{
          id,
          canAccessAdmin: permissions?.canAccessAdmin,
          collection,
          data,
          editURL,
          entityLabel,
          fetchURL,
          global,
          isLoading,
          isLoadingVersions,
          user,
          versionsData,
        }}
      />
    </EditDepthContext.Provider>
  )
}
export default VersionsView
