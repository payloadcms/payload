'use client'

import {
  Button,
  SaveButton,
  toast,
  Translation,
  useConfig,
  useForm,
  useFormModified,
  useTranslation,
} from '@payloadcms/ui'
import React from 'react'

import type {
  PluginImportExportTranslationKeys,
  PluginImportExportTranslations,
} from '../../translations/index.js'

export const ExportSaveButton: React.FC = () => {
  const { t } = useTranslation<PluginImportExportTranslations, PluginImportExportTranslationKeys>()
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const { getData, setModified } = useForm()
  const modified = useFormModified()

  const label = t('general:save')

  const handleDownload = async () => {
    let timeoutID: null | ReturnType<typeof setTimeout> = null
    let toastID: null | number | string = null

    try {
      setModified(false) // Reset modified state
      const data = getData()

      // Set a timeout to show toast if the request takes longer than 200ms
      timeoutID = setTimeout(() => {
        toastID = toast.success('Your export is being processed...')
      }, 200)

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

      // Clear the timeout if fetch completes quickly
      if (timeoutID) {
        clearTimeout(timeoutID)
      }

      // Dismiss the toast if it was shown
      if (toastID) {
        toast.dismiss(toastID)
      }

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
      toast.error('Error downloading file')
    }
  }

  return (
    <React.Fragment>
      <SaveButton label={label}></SaveButton>
      <Button disabled={!modified} onClick={handleDownload} size="medium" type="button">
        <Translation i18nKey="upload:download" t={t} />
      </Button>
    </React.Fragment>
  )
}
