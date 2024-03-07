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
import React, { Fragment, useEffect } from 'react'
import { useCallback } from 'react'

export const EditViewClient: React.FC = () => {
  const { collectionSlug, getDocPermissions, getVersions, globalSlug, isEditing, setDocumentInfo } =
    useDocumentInfo()

  const {
    routes: { admin: adminRoute },
  } = useConfig()

  const router = useRouter()
  const { dispatchFormQueryParams } = useFormQueryParams()

  const { getComponentMap } = useComponentMap()

  const { Edit, actionsMap } = getComponentMap({
    collectionSlug,
    globalSlug,
  })

  const onSave = useCallback(
    async (json: { doc }) => {
      void getVersions()
      void getDocPermissions()

      if (!isEditing) {
        router.push(`${adminRoute}/collections/${collectionSlug}/${json?.doc?.id}`)
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
    ],
  )

  useEffect(() => {
    setDocumentInfo({
      onSave,
    })
  }, [setDocumentInfo, onSave])

  // Allow the `DocumentInfoProvider` to hydrate
  if (!Edit || (!collectionSlug && !globalSlug)) {
    return <LoadingOverlay />
  }

  return (
    <Fragment>
      <SetViewActions actions={actionsMap?.Edit?.Default} />
      {Edit}
    </Fragment>
  )
}
