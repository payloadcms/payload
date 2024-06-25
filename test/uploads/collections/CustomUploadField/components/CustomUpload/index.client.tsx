'use client'

import { Upload, useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

export const CustomUploadClient = () => {
  const { collectionSlug, docConfig, initialState } = useDocumentInfo()

  return (
    <div>
      <h3>This text was rendered on the client</h3>
      <Upload
        collectionSlug={collectionSlug}
        initialState={initialState}
        uploadConfig={'upload' in docConfig ? docConfig.upload : undefined}
      />
      <h4>
        And that{' '}
        <span aria-label="point up" role="img">
          👆
        </span>{' '}
        is re-used from payload components
      </h4>
    </div>
  )
}
