'use client'

import {
  LoadingOverlay,
  SetViewActions,
  useComponentMap,
  useConfig,
  useDocumentInfo,
  useFormQueryParams,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import { useSearchParams } from 'next/navigation.js'
import React, { Fragment } from 'react'
import { useCallback } from 'react'

import { DefaultEditView } from './Default/index.js'
import { ClientSideEditViewComponent } from 'packages/payload/src/config/types.js'

export const EditViewClient: ClientSideEditViewComponent = ({ initialData, initialState }) => {
  const { collectionSlug, getDocPermissions, getVersions, globalSlug, isEditing } =
    useDocumentInfo()

  const {
    routes: { admin: adminRoute },
  } = useConfig()

  const router = useRouter()
  const { dispatchFormQueryParams } = useFormQueryParams()

  const { getComponentMap } = useComponentMap()
  const params = useSearchParams()

  const locale = params.get('locale')

  const { CustomEditView, actionsMap } = getComponentMap({
    collectionSlug,
    globalSlug,
  })

  const onSave = useCallback(
    (json: { doc }) => {
      void getVersions()
      void getDocPermissions()

      if (!isEditing) {
        // Redirect to the same locale if it's been set
        const redirectRoute = `${adminRoute}/collections/${collectionSlug}/${json?.doc?.id}${locale ? `?locale=${locale}` : ''}`
        router.push(redirectRoute)
      } else {
        dispatchFormQueryParams({
          type: 'SET',
          params: {
            uploadEdits: null,
          },
        })
      }
    },
    [
      adminRoute,
      collectionSlug,
      dispatchFormQueryParams,
      getDocPermissions,
      getVersions,
      isEditing,
      router,
      locale,
    ],
  )

  // Allow the `DocumentInfoProvider` to hydrate
  if (!collectionSlug && !globalSlug) {
    return <LoadingOverlay />
  }

  const ViewToRender = CustomEditView || DefaultEditView

  return (
    <Fragment>
      <SetViewActions actions={actionsMap?.Edit?.Default} />
      <ViewToRender onSave={onSave} initialData={initialData} initialState={initialState} />
    </Fragment>
  )
}
