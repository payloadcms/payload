import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import type { Fields } from '../../forms/Form/types.js'
import type { IndexProps } from './types.js'

import usePayloadAPI from '../../../hooks/usePayloadAPI.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema/index.js'
import { useAuth } from '../../utilities/Auth/index.js'
import { useConfig } from '../../utilities/Config/index.js'
import { useDocumentInfo } from '../../utilities/DocumentInfo/index.js'
import { useLocale } from '../../utilities/Locale/index.js'
import { usePreferences } from '../../utilities/Preferences/index.js'
import RenderCustomComponent from '../../utilities/RenderCustomComponent/index.js'
import DefaultGlobal from './Default.js'

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
        t: t as any,
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
        t: t as any,
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
        action: `${serverURL}${api}/globals/${slug}?locale=${locale}&depth=0&fallback-locale=null`,
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
