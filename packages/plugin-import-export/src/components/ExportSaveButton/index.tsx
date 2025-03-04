'use client'

import { Button, SaveButton, useTranslation } from '@payloadcms/ui'
import React from 'react'

export const ExportSaveButton: React.FC = () => {
  const { t } = useTranslation()
  const label = t('general:save')

  const handleDownload = () => {
    console.log('Download')
    // TODO: create a post to the download endpoint to stream data back to the client
  }

  return (
    <React.Fragment>
      <SaveButton label={label}></SaveButton>
      <Button onClick={handleDownload} size="medium" type="button">
        Download
      </Button>
    </React.Fragment>
  )
}
