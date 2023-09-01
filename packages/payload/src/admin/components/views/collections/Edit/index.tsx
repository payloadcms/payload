import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, useHistory, useRouteMatch } from 'react-router-dom'

import type { CollectionPermission } from '../../../../../auth'
import type { Fields } from '../../../forms/Form/types'
import type { IndexProps } from './types'

import usePayloadAPI from '../../../../hooks/usePayloadAPI'
import buildStateFromSchema from '../../../forms/Form/buildStateFromSchema'
import { useAuth } from '../../../utilities/Auth'
import { useConfig } from '../../../utilities/Config'
import { useDocumentInfo } from '../../../utilities/DocumentInfo'
import { EditDepthContext } from '../../../utilities/EditDepth'
import { useLocale } from '../../../utilities/Locale'
import RenderCustomComponent from '../../../utilities/RenderCustomComponent'
import DefaultEdit from './Default'
import formatFields from './formatFields'

const EditView: React.FC<IndexProps> = (props) => {
  const { collection: incomingCollection, isEditing } = props

  const { admin: { components: { views: { Edit: CustomEdit } = {} } = {} } = {}, slug } =
    incomingCollection

  const [fields] = useState(() => formatFields(incomingCollection, isEditing))
  const [collection] = useState(() => ({ ...incomingCollection, fields }))
  const [redirect, setRedirect] = useState<string>()

  const { code: locale } = useLocale()
  const {
    routes: { admin, api },
    serverURL,
  } = useConfig()
  const { params: { id } = {} } = useRouteMatch<Record<string, string>>()
  const history = useHistory()
  const [internalState, setInternalState] = useState<Fields>()
  const [updatedAt, setUpdatedAt] = useState<string>()
  const { user } = useAuth()
  const userRef = useRef(user)
  const { docPermissions, getDocPermissions, getDocPreferences, getVersions } = useDocumentInfo()
  const { t } = useTranslation('general')

  const [{ data, isError, isLoading: isLoadingData }] = usePayloadAPI(
    isEditing ? `${serverURL}${api}/${slug}/${id}` : null,
    { initialData: null, initialParams: { depth: 0, draft: 'true', 'fallback-locale': 'null' } },
  )

  const buildState = useCallback(
    async (doc, overrides?: Partial<Parameters<typeof buildStateFromSchema>[0]>) => {
      const preferences = await getDocPreferences()

      const state = await buildStateFromSchema({
        data: doc || {},
        fieldSchema: overrides.fieldSchema,
        id,
        locale,
        operation: 'update',
        preferences,
        t,
        user: userRef.current,
        ...overrides,
      })

      setInternalState(state)
    },
    [getDocPreferences, id, locale, t],
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

  if (isError) {
    return <Redirect to={`${admin}/not-found`} />
  }

  const apiURL = `${serverURL}${api}/${slug}/${id}?locale=${locale}${
    collection.versions.drafts ? '&draft=true' : ''
  }`
  const action = `${serverURL}${api}/${slug}${
    isEditing ? `/${id}` : ''
  }?locale=${locale}&depth=0&fallback-locale=null`
  const hasSavePermission =
    (isEditing && docPermissions?.update?.permission) ||
    (!isEditing && (docPermissions as CollectionPermission)?.create?.permission)
  const isLoading = !internalState || !docPermissions || isLoadingData

  return (
    <EditDepthContext.Provider value={1}>
      <RenderCustomComponent
        componentProps={{
          action,
          apiURL,
          collection,
          data,
          hasSavePermission,
          id,
          internalState,
          isEditing,
          isLoading,
          onSave,
          permissions: docPermissions,
          updatedAt: updatedAt || data?.updatedAt,
        }}
        CustomComponent={CustomEdit}
        DefaultComponent={DefaultEdit}
      />
    </EditDepthContext.Provider>
  )
}
export default EditView
