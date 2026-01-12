'use client'
import type React from 'react'

import { useDocumentInfo, useField } from '@payloadcms/ui'
import { useEffect } from 'react'

import { useImportExport } from '../ImportExportProvider/index.js'

export const CollectionField: React.FC = () => {
  const { id } = useDocumentInfo()
  const { setValue } = useField({ path: 'collectionSlug' })
  const { collection } = useImportExport()

  useEffect(() => {
    if (id) {
      return
    }
    setValue(collection)
  }, [id, collection, setValue])

  return null
}
