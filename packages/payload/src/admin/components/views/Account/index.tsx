import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import type { CollectionPermission } from '../../../../auth'
import type { Fields } from '../../forms/Form/types'
import type { DefaultAccountViewProps } from './Default'

import usePayloadAPI from '../../../hooks/usePayloadAPI'
import { useStepNav } from '../../elements/StepNav'
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema'
import { fieldTypes } from '../../forms/field-types'
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
  const {
    id,
    slug,
    collection,
    docPermissions,
    getDocPermissions,
    getDocPreferences,
    preferencesKey,
  } = useDocumentInfo()
  const { getPreference } = usePreferences()

  const config = useConfig()

  const {
    admin: { components: { views: { Account: CustomAccountComponent } = {} } = {} },
    routes: { api },
    serverURL,
  } = useConfig()

  const { t } = useTranslation('authentication')

  const { fields } = collection || {}

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
      await getDocPermissions()

      const preferences = await getDocPreferences()

      const state = await buildStateFromSchema({
        id,
        config,
        data: json.doc,
        fieldSchema: collection?.fields,
        locale,
        operation: 'update',
        preferences,
        t,
        user,
      })
      setInternalState(state)
    },
    [collection, user, id, t, locale, getDocPermissions, getDocPreferences, config],
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
        id,
        config,
        data: dataToRender,
        fieldSchema: fields,
        locale,
        operation: 'update',
        preferences,
        t,
        user: userRef.current,
      })

      if (preferencesKey) {
        await getPreference(preferencesKey)
      }

      setInternalState(state)
    }

    if (dataToRender) awaitInternalState()
  }, [
    dataToRender,
    fields,
    id,
    locale,
    preferencesKey,
    getPreference,
    t,
    getDocPreferences,
    config,
  ])

  const isLoading = !internalState || !docPermissions || isLoadingData

  const componentProps: DefaultAccountViewProps = {
    id: id.toString(),
    action,
    apiURL,
    collection,
    data,
    fieldTypes,
    hasSavePermission,
    initialState: internalState,
    isLoading,
    onSave,
    permissions: docPermissions as CollectionPermission,
    updatedAt: data?.updatedAt,
    user,
  }

  return (
    <RenderCustomComponent
      CustomComponent={
        typeof CustomAccountComponent === 'function' ? CustomAccountComponent : undefined
      }
      DefaultComponent={DefaultAccount}
      componentProps={componentProps}
    />
  )
}

export default AccountView
