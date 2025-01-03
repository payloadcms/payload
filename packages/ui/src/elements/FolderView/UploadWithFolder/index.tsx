'use client'
import React from 'react'

import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { Upload } from '../../Upload/index.js'
import { SelectFolder } from '../SelectFolder/index.js'

export function UploadWithFolderSelection() {
  const { collectionSlug, docConfig, initialState } = useDocumentInfo()

  if (!collectionSlug || !docConfig || !('upload' in docConfig)) {
    return null
  }

  return (
    <div>
      <Upload
        collectionSlug={collectionSlug}
        customActions={[<SelectFolder key={1} />]}
        initialState={initialState}
        uploadConfig={docConfig.upload}
      />
    </div>
  )
}
