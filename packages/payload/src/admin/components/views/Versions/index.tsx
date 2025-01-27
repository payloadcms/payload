import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { IndexProps } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import usePayloadAPI from '../../../hooks/usePayloadAPI'
import { useActions } from '../../utilities/ActionsProvider'
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

  const { setViewActions } = useActions()

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
  const [latestDraftVersion, setLatestDraftVersion] = useState(undefined)
  const [latestPublishedVersion, setLatestPublishedVersion] = useState(undefined)

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
    const EditCollection = collection?.admin?.components?.views?.Edit

    if (typeof EditCollection === 'function') {
      CustomVersionsView = EditCollection
    } else if (
      typeof EditCollection === 'object' &&
      typeof EditCollection.Versions === 'function'
    ) {
      CustomVersionsView = EditCollection.Versions
    } else if (
      typeof EditCollection?.Versions === 'object' &&
      'Component' in EditCollection.Versions &&
      typeof EditCollection.Versions.Component === 'function'
    ) {
      CustomVersionsView = EditCollection.Versions.Component
    }
  }

  if (global) {
    ;({ slug } = global)
    docURL = `${serverURL}${api}/globals/${slug}`
    entityLabel = getTranslation(global.label, i18n)
    editURL = `${admin}/globals/${global.slug}`

    // See note above about cascading component definitions
    const EditGlobal = global?.admin?.components?.views?.Edit

    if (typeof EditGlobal === 'function') {
      CustomVersionsView = EditGlobal
    } else if (typeof EditGlobal === 'object' && typeof EditGlobal.Versions === 'function') {
      CustomVersionsView = EditGlobal.Versions
    } else if (
      typeof EditGlobal?.Versions === 'object' &&
      'Component' in EditGlobal.Versions &&
      typeof EditGlobal.Versions.Component === 'function'
    ) {
      CustomVersionsView = EditGlobal.Versions.Component
    }
  }

  const [{ data, isLoading }] = usePayloadAPI(docURL, { initialParams: { draft: 'true' } })
  const [{ data: versionsData, isLoading: isLoadingVersions }, { setParams }] =
    usePayloadAPI(fetchURL)

  const hasDraftsEnabled = collection?.versions?.drafts || global?.versions?.drafts

  const sharedParams = (status) => {
    return {
      depth: 0,
      limit: 1,
      sort: '-updatedAt',
      where: {
        'version._status': {
          equals: status,
        },
      },
    }
  }

  const [{ data: draft }] = usePayloadAPI(fetchURL, {
    initialParams: hasDraftsEnabled ? { ...sharedParams('draft') } : {},
  })

  const [{ data: published }] = usePayloadAPI(fetchURL, {
    initialParams: hasDraftsEnabled ? { ...sharedParams('published') } : {},
  })

  useEffect(() => {
    if (hasDraftsEnabled) {
      const formattedPublished = published?.docs?.length > 0 && published?.docs[0]
      const formattedDraft = draft?.docs?.length > 0 && draft?.docs[0]

      if (!formattedPublished || !formattedDraft) return

      const publishedNewerThanDraft = formattedPublished?.updatedAt > formattedDraft?.updatedAt
      setLatestDraftVersion(publishedNewerThanDraft ? undefined : formattedDraft?.id)
      setLatestPublishedVersion(formattedPublished.latest ? formattedPublished?.id : undefined)
    }
  }, [hasDraftsEnabled, draft, published])

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

  useEffect(() => {
    const editConfig = (collection || global)?.admin?.components?.views?.Edit
    const versionsActions =
      editConfig && 'Versions' in editConfig && 'actions' in editConfig.Versions
        ? editConfig.Versions.actions
        : []

    setViewActions(versionsActions)

    return () => {
      setViewActions([])
    }
  }, [collection, global, setViewActions])

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
          latestDraftVersion,
          latestPublishedVersion,
          user,
          versionsData,
        }}
      />
    </EditDepthContext.Provider>
  )
}
export default VersionsView
