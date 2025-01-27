import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import type { Fields } from '../../forms/Form/types'
import type { DefaultGlobalViewProps } from './Default'
import type { IndexProps } from './types'

import usePayloadAPI from '../../../hooks/usePayloadAPI'
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema'
import { fieldTypes } from '../../forms/field-types'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { useDocumentEvents } from '../../utilities/DocumentEvents'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { EditDepthContext } from '../../utilities/EditDepth'
import { useLocale } from '../../utilities/Locale'
import { usePreferences } from '../../utilities/Preferences'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import DefaultGlobalView from './Default'

const GlobalView: React.FC<IndexProps> = (props) => {
  const { global } = props

  const { state: locationState } = useLocation<{ data?: Record<string, unknown> }>()
  const { code: locale } = useLocale()
  const { permissions, user } = useAuth()
  const [initialState, setInitialState] = useState<Fields>()
  const [updatedAt, setUpdatedAt] = useState<string>()
  const {
    action,
    docPermissions,
    getDocPermissions,
    getDocPreferences,
    getVersions,
    preferencesKey,
  } = useDocumentInfo()
  const { getPreference } = usePreferences()
  const { t } = useTranslation()
  const config = useConfig()

  const {
    routes: { api },
    serverURL,
  } = useConfig()

  const { reportUpdate } = useDocumentEvents()

  const { slug, admin: { components: { views: { Edit: Edit } = {} } = {} } = {}, fields } = global

  const onSave = useCallback(
    async (json) => {
      reportUpdate({
        entitySlug: global.slug,
        updatedAt: json?.result?.updatedAt || new Date().toISOString(),
      })

      void getVersions()
      void getDocPermissions()
      setUpdatedAt(json?.result?.updatedAt)

      const preferences = await getDocPreferences()

      const state = await buildStateFromSchema({
        config,
        data: json.result,
        fieldSchema: fields,
        locale,
        operation: 'update',
        preferences,
        t,
        user,
      })
      setInitialState(state)
    },
    [
      getVersions,
      fields,
      user,
      locale,
      t,
      getDocPermissions,
      getDocPreferences,
      config,
      global,
      reportUpdate,
    ],
  )

  const [{ data, isLoading: isLoadingData }] = usePayloadAPI(`${serverURL}${api}/globals/${slug}`, {
    initialData: null,
    initialParams: { depth: 0, draft: 'true', 'fallback-locale': 'null' },
  })

  const dataToRender = locationState?.data || data

  useEffect(() => {
    const awaitInitialState = async () => {
      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
        config,
        data: dataToRender,
        fieldSchema: fields,
        locale,
        operation: 'update',
        preferences,
        t,
        user,
      })

      if (preferencesKey) {
        await getPreference(preferencesKey)
      }

      setInitialState(state)
    }

    if (dataToRender) void awaitInitialState()
  }, [
    dataToRender,
    fields,
    user,
    locale,
    getPreference,
    preferencesKey,
    t,
    getDocPreferences,
    config,
  ])

  const isLoading = !initialState || !docPermissions || isLoadingData

  const componentProps: DefaultGlobalViewProps = {
    action,
    apiURL: `${serverURL}${api}/globals/${slug}?locale=${locale}${
      global.versions?.drafts ? '&draft=true' : ''
    }`,
    canAccessAdmin: permissions?.canAccessAdmin,
    data: dataToRender,
    fieldTypes,
    global,
    initialState,
    isLoading,
    onSave,
    permissions: docPermissions,
    updatedAt: updatedAt || dataToRender?.updatedAt,
    user,
  }

  return (
    <EditDepthContext.Provider value={1}>
      <RenderCustomComponent
        CustomComponent={typeof Edit === 'function' ? Edit : undefined}
        DefaultComponent={DefaultGlobalView}
        componentProps={componentProps}
      />
    </EditDepthContext.Provider>
  )
}
export default GlobalView
