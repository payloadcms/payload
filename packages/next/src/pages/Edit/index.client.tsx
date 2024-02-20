'use client'
import React from 'react'
import { DefaultEditView, EditViewProps, useDocumentInfo } from '@payloadcms/ui'
import { useCallback } from 'react'

export const DefaultEditViewClient: React.FC<EditViewProps> = (props) => {
  const id = 'id' in props ? props.id : undefined
  const collectionSlug = 'collectionSlug' in props ? props.collectionSlug : undefined
  const isEditing = Boolean(id && collectionSlug)

  const { getVersions, getDocPermissions } = useDocumentInfo()

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

  return <DefaultEditView {...props} onSave={onSave} />
}
