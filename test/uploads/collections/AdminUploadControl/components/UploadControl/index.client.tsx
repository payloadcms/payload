'use client'
import { Button, useUploadControls } from '@payloadcms/ui'
import React, { useCallback } from 'react'

export const UploadControl = () => {
  const { setUploadControlFile, setUploadControlFileUrl } = useUploadControls()

  const loadFromFile = useCallback(async () => {
    const response = await fetch(
      'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/universal-truth.jpg',
    )
    const blob = await response.blob()
    const file = new File([blob], 'universal-truth.jpg', { type: 'image/jpeg' })
    setUploadControlFile(file)
  }, [setUploadControlFile])

  const loadFromUrl = useCallback(() => {
    setUploadControlFileUrl(
      'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/universal-truth.jpg',
    )
  }, [setUploadControlFileUrl])

  return (
    <div>
      <Button id="load-from-file-upload-button" onClick={loadFromFile}>
        Load from File
      </Button>
      <br />
      <Button id="load-from-url-upload-button" onClick={loadFromUrl}>
        Load from URL
      </Button>
    </div>
  )
}
