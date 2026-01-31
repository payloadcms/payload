'use client'
import type React from 'react'

import { useDocumentInfo, useField } from '@payloadcms/ui'
import { useEffect } from 'react'

import { useImportExport } from '../ImportExportProvider/index.js'

export const CollectionField: React.FC = () => {
  const { id, collectionSlug, docConfig } = useDocumentInfo()
  const { setValue } = useField({ path: 'collectionSlug' })
  const { collection } = useImportExport()

  const defaultCollectionSlug = docConfig?.admin?.custom?.defaultCollectionSlug as
    | string
    | undefined

  useEffect(() => {
    if (id) {
      return
    }
    if (collection) {
      setValue(collection)
    } else if (defaultCollectionSlug) {
      setValue(defaultCollectionSlug)
    } else if (collectionSlug) {
      setValue(collectionSlug)
    }
  }, [id, collection, setValue, collectionSlug, defaultCollectionSlug])

  return null
}
