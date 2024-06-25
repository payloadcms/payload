'use client'

import { Upload, useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

export const CustomUploadClient = () => {
  const { collectionSlug, docConfig, initialState } = useDocumentInfo()

  return (
    <div>
      <h3>Upload component provided via the plugin</h3>
      <Upload
        collectionSlug={collectionSlug}
        initialState={initialState}
        uploadConfig={'upload' in docConfig ? docConfig.upload : undefined}
      />
    </div>
  )
}
