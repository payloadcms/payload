import queryString from 'qs'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useRouteMatch } from 'react-router-dom'

import type { CollectionPermission } from '../../../../../auth'
import type { Fields } from '../../../forms/Form/types'
import type { QueryParamTypes } from '../../../utilities/FormQueryParams'
import type { DefaultEditViewProps } from './Default'
import type { IndexProps } from './types'

import usePayloadAPI from '../../../../hooks/usePayloadAPI'
import buildStateFromSchema from '../../../forms/Form/buildStateFromSchema'
import { fieldTypes } from '../../../forms/field-types'
import { useAuth } from '../../../utilities/Auth'
import { useConfig } from '../../../utilities/Config'
import { useDocumentInfo } from '../../../utilities/DocumentInfo'
import { EditDepthContext } from '../../../utilities/EditDepth'
import { FormQueryParams } from '../../../utilities/FormQueryParams'
import { useLocale } from '../../../utilities/Locale'
import RenderCustomComponent from '../../../utilities/RenderCustomComponent'
import NotFound from '../../NotFound'
import DefaultEdit from './Default'
import formatFields from './formatFields'

const EditView: React.FC<IndexProps> = (props) => {
  const { collection: incomingCollection, isEditing } = props

  const { slug: collectionSlug, admin: { components: { views: { Edit } = {} } = {} } = {} } =
    incomingCollection

  const [fields] = useState(() => formatFields(incomingCollection, isEditing))
  const [collection] = useState(() => ({ ...incomingCollection, fields }))
  const [redirect, setRedirect] = useState<string>()
  const [formQueryParams, setFormQueryParams] = useState<QueryParamTypes>({
    depth: 0,
    'fallback-locale': 'null',
    locale: '',
    uploadEdits: undefined,
  })

  const formattedQueryParams = queryString.stringify(formQueryParams)

  const { code: locale } = useLocale()

  const config = useConfig()
  const {
    routes: { admin, api },
    serverURL,
  } = config

  const { params: { id } = {} } = useRouteMatch<Record<string, string>>()
  const history = useHistory<{ refetchDocumentData?: boolean }>()

  const [internalState, setInternalState] = useState<Fields>()
  const [updatedAt, setUpdatedAt] = useState<string>()
  const { permissions, user } = useAuth()
  const userRef = useRef(user)
  const { docPermissions, getDocPermissions, getDocPreferences, getVersions } = useDocumentInfo()
  const { t } = useTranslation('general')

  const [{ data, isError, isLoading: isLoadingData }, { refetchData }] = usePayloadAPI(
    isEditing ? `${serverURL}${api}/${collectionSlug}/${id}` : '',
    { initialData: null, initialParams: { depth: 0, draft: 'true', 'fallback-locale': 'null' } },
  )

  const buildState = useCallback(
    async (doc, overrides?: Partial<Parameters<typeof buildStateFromSchema>[0]>) => {
      const preferences = await getDocPreferences()

      const state = await buildStateFromSchema({
        id,
        config,
        data: doc || {},
        fieldSchema: overrides?.fieldSchema,
        locale,
        operation: 'update',
        preferences,
        t,
        user: userRef.current,
        ...overrides,
      })

      setInternalState(state)
    },
    [getDocPreferences, id, locale, t, config],
  )

  const onSave = useCallback(
    async (json: { doc }) => {
      getVersions()
      getDocPermissions()
      setUpdatedAt(json?.doc?.updatedAt)
      if (!isEditing) {
        setRedirect(`${admin}/collections/${collection.slug}/${json?.doc?.id}`)
      } else {
        buildState(json.doc, {
          fieldSchema: collection.fields,
        })
        setFormQueryParams((params) => ({
          ...params,
          uploadEdits: undefined,
        }))
      }
    },
    [admin, getVersions, isEditing, buildState, getDocPermissions, collection],
  )

  useEffect(() => {
    if (fields && (isEditing ? data : true)) {
      const awaitInternalState = async () => {
        setUpdatedAt(data?.updatedAt)
        buildState(data, {
          fieldSchema: fields,
          operation: isEditing ? 'update' : 'create',
        })
      }

      awaitInternalState()
    }
  }, [isEditing, data, buildState, fields])

  useEffect(() => {
    if (redirect) {
      history.push(redirect)
    }
  }, [history, redirect])

  useEffect(() => {
    setFormQueryParams((params) => ({
      ...params,
      locale,
    }))
  }, [locale])

  useEffect(() => {
    if (history.location.state?.refetchDocumentData) {
      void refetchData()
    }
  }, [history.location.state?.refetchDocumentData, refetchData])

  if (isError) {
    return <NotFound marginTop="large" />
  }

  const apiURL = `${serverURL}${api}/${collectionSlug}/${id}?locale=${locale}${
    collection.versions.drafts ? '&draft=true' : ''
  }`

  const action = `${serverURL}${api}/${collectionSlug}${
    isEditing ? `/${id}` : ''
  }?${formattedQueryParams}`

  const hasSavePermission =
    (isEditing && docPermissions?.update?.permission) ||
    (!isEditing && (docPermissions as CollectionPermission)?.create?.permission)

  const isLoading = !internalState || !docPermissions || isLoadingData

  const componentProps: DefaultEditViewProps = {
    id,
    action,
    apiURL,
    canAccessAdmin: permissions?.canAccessAdmin,
    collection,
    data,
    fieldTypes,
    hasSavePermission,
    internalState,
    isEditing,
    isLoading,
    onSave,
    permissions: docPermissions as CollectionPermission,
    updatedAt: updatedAt || data?.updatedAt,
    user,
  }

  return (
    <EditDepthContext.Provider value={1}>
      <FormQueryParams.Provider value={{ formQueryParams, setFormQueryParams }}>
        <RenderCustomComponent
          CustomComponent={typeof Edit === 'function' ? Edit : undefined}
          DefaultComponent={DefaultEdit}
          componentProps={componentProps}
        />
      </FormQueryParams.Provider>
    </EditDepthContext.Provider>
  )
}
export default EditView
