import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import type { Fields } from '../../forms/Form/types'
import type { IndexProps } from './types'

import usePayloadAPI from '../../../hooks/usePayloadAPI'
import { useStepNav } from '../../elements/StepNav'
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { useLocale } from '../../utilities/Locale'
import { usePreferences } from '../../utilities/Preferences'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import DefaultGlobal from './Default'

const GlobalView: React.FC<IndexProps> = (props) => {
  const { state: locationState } = useLocation<{ data?: Record<string, unknown> }>()
  const { code: locale } = useLocale()
  const { setStepNav } = useStepNav()
  const { user } = useAuth()
  const [initialState, setInitialState] = useState<Fields>()
  const [updatedAt, setUpdatedAt] = useState<string>()
  const { docPermissions, getDocPermissions, getDocPreferences, getVersions, preferencesKey } =
    useDocumentInfo()
  const { getPreference } = usePreferences()
  const { t } = useTranslation()

  const {
    routes: { api },
    serverURL,
  } = useConfig()

  const { global } = props

  const {
    admin: { components: { views: { Edit: CustomEdit } = {} } = {} } = {},
    fields,
    label,
    slug,
  } = global

  const onSave = useCallback(
    async (json) => {
      getVersions()
      getDocPermissions()
      setUpdatedAt(json?.result?.updatedAt)
      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
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
    [getVersions, fields, user, locale, t, getDocPermissions, getDocPreferences],
  )

  const [{ data, isLoading: isLoadingData }] = usePayloadAPI(`${serverURL}${api}/globals/${slug}`, {
    initialData: null,
    initialParams: { depth: 0, draft: 'true', 'fallback-locale': 'null' },
  })

  const dataToRender = locationState?.data || data

  useEffect(() => {
    const nav = [
      {
        label,
      },
    ]

    setStepNav(nav)
  }, [setStepNav, label])

  useEffect(() => {
    const awaitInitialState = async () => {
      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
        data: dataToRender,
        fieldSchema: fields,
        locale,
        operation: 'update',
        preferences,
        t,
        user,
      })
      await getPreference(preferencesKey)
      setInitialState(state)
    }

    if (dataToRender) awaitInitialState()
  }, [dataToRender, fields, user, locale, getPreference, preferencesKey, t, getDocPreferences])

  const isLoading = !initialState || !docPermissions || isLoadingData

  return (
    <RenderCustomComponent
      componentProps={{
        action: `${serverURL}${api}/globals/${slug}?locale=${locale}&fallback-locale=null`,
        apiURL: `${serverURL}${api}/globals/${slug}?locale=${locale}${
          global.versions?.drafts ? '&draft=true' : ''
        }`,
        data: dataToRender,
        global,
        initialState,
        isLoading,
        onSave,
        permissions: docPermissions,
        updatedAt: updatedAt || dataToRender?.updatedAt,
      }}
      CustomComponent={CustomEdit}
      DefaultComponent={DefaultGlobal}
    />
  )
}
export default GlobalView
