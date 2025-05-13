'use client'

import { Button, SaveButton, useConfig, useForm, useTranslation } from '@payloadcms/ui'
import React from 'react'

export const ExportSaveButton: React.FC = () => {
  const { t } = useTranslation()
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const { getData } = useForm()

  const label = t('general:save')

  const handleDownload = async () => {
    try {
      const data = getData()
      const response = await fetch(`${serverURL}${api}/exports/download`, {
        body: JSON.stringify({
          data,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const fileStream = response.body
      const reader = fileStream?.getReader()
      const decoder = new TextDecoder()
      let result = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        result += decoder.decode(value, { stream: true })
      }

      const blob = new Blob([result], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.name}.${data.format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
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
