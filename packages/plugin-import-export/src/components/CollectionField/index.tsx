'use client'
import type React from 'react'

import { useField } from '@payloadcms/ui'
import { useEffect } from 'react'

import { useImportExport } from '../ImportExportProvider/index.js'

export const CollectionField: React.FC = () => {
  const { setValue } = useField({ path: 'collectionSlug' })
  const { collection } = useImportExport()

  useEffect(() => {
    setValue(collection)
  }, [collection, setValue])

  return null
}
