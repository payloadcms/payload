'use client'
import { Button, useBulkUploadControls } from '@payloadcms/ui'
import React, { useCallback } from 'react'

export const BulkUploadControl = () => {
  const { setBulkUploadControlFiles } = useBulkUploadControls()

  const bulkLoadFromFile = useCallback(async () => {
    const response = await fetch(
      'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/universal-truth.jpg',
    )
    const blob = await response.blob()
    const file = new File([blob], 'bulk-universal-truth.jpg', { type: 'image/jpeg' })
    setBulkUploadControlFiles([file, file])
  }, [setBulkUploadControlFiles])

  return (
    <div>
      <Button id="bulk-load-from-file-upload-button" onClick={bulkLoadFromFile}>
        Bulk Load from File
      </Button>
    </div>
  )
}
