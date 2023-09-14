import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import type { Fields } from '../../forms/Form/types'

import usePayloadAPI from '../../../hooks/usePayloadAPI'
import { useStepNav } from '../../elements/StepNav'
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { useLocale } from '../../utilities/Locale'
import { usePreferences } from '../../utilities/Preferences'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import DefaultAccount from './Default'

const AccountView: React.FC = () => {
  const { state: locationState } = useLocation<{ data: unknown }>()
  const { code: locale } = useLocale()
  const { setStepNav } = useStepNav()
  const { user } = useAuth()
  const userRef = useRef(user)
  const [internalState, setInternalState] = useState<Fields>()
  const { docPermissions, getDocPermissions, getDocPreferences, id, preferencesKey, slug } =
    useDocumentInfo()
  const { getPreference } = usePreferences()

  const {
    admin: {
      components: {
        views: { Account: CustomAccount } = {
          Account: undefined,
        },
      } = {},
    },
    collections,
    routes: { api },
    serverURL,
  } = useConfig()

  const { t } = useTranslation('authentication')

  const collection = collections.find((coll) => coll.slug === slug)

  const { fields } = collection

  const [{ data, isLoading: isLoadingData }] = usePayloadAPI(`${serverURL}${api}/${slug}/${id}`, {
    initialData: null,
    initialParams: {
      depth: 0,
      'fallback-locale': 'null',
    },
  })

  const hasSavePermission = docPermissions?.update?.permission
  const dataToRender = locationState?.data || data
  const apiURL = `${serverURL}${api}/${slug}/${data?.id}?locale=${locale}`

  const action = `${serverURL}${api}/${slug}/${data?.id}?locale=${locale}`

  const onSave = React.useCallback(
    async (json: any) => {
      getDocPermissions()
      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
        data: json.doc,
        fieldSchema: collection.fields,
        id,
        locale,
        operation: 'update',
        preferences,
        t,
        user,
      })
      setInternalState(state)
    },
    [collection, user, id, t, locale, getDocPermissions, getDocPreferences],
  )

  useEffect(() => {
    const nav = [
      {
        label: t('account'),
      },
    ]

    setStepNav(nav)
  }, [setStepNav, t])

  useEffect(() => {
    const awaitInternalState = async () => {
      const preferences = await getDocPreferences()

      const state = await buildStateFromSchema({
        data: dataToRender,
        fieldSchema: fields,
        id,
        locale,
        operation: 'update',
        preferences,
        t,
        user: userRef.current,
      })

      await getPreference(preferencesKey)
      setInternalState(state)
    }

    if (dataToRender) awaitInternalState()
  }, [dataToRender, fields, id, locale, preferencesKey, getPreference, t, getDocPreferences])

  const isLoading = !internalState || !docPermissions || isLoadingData

  return (
    <RenderCustomComponent
      CustomComponent={CustomAccount}
      DefaultComponent={DefaultAccount}
      componentProps={{
        action,
        apiURL,
        collection,
        data,
        hasSavePermission,
        initialState: internalState,
        isLoading,
        onSave,
        permissions: docPermissions,
      }}
    />
  )
}

export default AccountView
