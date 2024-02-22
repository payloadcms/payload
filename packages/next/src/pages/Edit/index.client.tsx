'use client'
import React, { Fragment } from 'react'
import { useComponentMap, useDocumentInfo } from '@payloadcms/ui'
import { useCallback } from 'react'
import { LoadingOverlay } from '../../../../ui/src/elements/Loading'

export const DefaultEditViewClient: React.FC = () => {
  const { id, getVersions, getDocPermissions, collectionSlug, globalSlug } = useDocumentInfo()

  const { componentMap } = useComponentMap()

  const { Edit } =
    componentMap[`${collectionSlug ? 'collections' : 'globals'}`][collectionSlug || globalSlug] ||
    {}

  const isEditing = Boolean(id && collectionSlug)

  const onSave = useCallback(
    async (json: { doc }) => {
      getVersions()
      getDocPermissions()

      if (!isEditing) {
        // setRedirect(`${admin}/collections/${collection.slug}/${json?.doc?.id}`)
      } else {
        // buildState(json.doc, {
        //   fieldSchema: collection.fields,
        // })
        // setFormQueryParams((params) => ({
        //   ...params,
        //   uploadEdits: undefined,
        // }))
      }
    },
    [getVersions, isEditing, getDocPermissions, collectionSlug],
  )

  if (!Edit) {
    return <LoadingOverlay />
  }

  return <Fragment>{Edit}</Fragment>
}
