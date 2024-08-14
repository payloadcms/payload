'use client'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

export const usePreviewURL = (): {
  generatePreviewURL: ({ openPreviewWindow }: { openPreviewWindow?: boolean }) => void
  isLoading: boolean
  label: string
  previewURL: string
} => {
  const { id, collectionSlug, globalSlug } = useDocumentInfo()

  const [isLoading, setIsLoading] = useState(false)
  const [previewURL, setPreviewURL] = useState('')
  const { code: locale } = useLocale()

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const { t } = useTranslation()

  const isGeneratingPreviewURL = useRef(false)

  // we need to regenerate the preview URL every time the button is clicked
  // to do this we need to fetch the document data fresh from the API
  // this will ensure the latest data is used when generating the preview URL
  const generatePreviewURL = useCallback(
    async ({ openPreviewWindow = false }) => {
      if (isGeneratingPreviewURL.current) return
      isGeneratingPreviewURL.current = true

      try {
        setIsLoading(true)

        let url = `${serverURL}${api}`
        if (collectionSlug) url = `${url}/${collectionSlug}/${id}/preview`
        if (globalSlug) url = `${url}/globals/${globalSlug}/preview`

        const res = await fetch(`${url}${locale ? `?locale=${locale}` : ''}`)

        if (!res.ok) throw new Error()
        const newPreviewURL = await res.json()
        if (!newPreviewURL) throw new Error()
        setPreviewURL(newPreviewURL)
        setIsLoading(false)
        isGeneratingPreviewURL.current = false
        if (openPreviewWindow) window.open(newPreviewURL, '_blank')
      } catch (err) {
        setIsLoading(false)
        isGeneratingPreviewURL.current = false
        toast.error(t('error:previewing'))
      }
    },
    [serverURL, api, collectionSlug, globalSlug, id, locale, t],
  )

  return {
    generatePreviewURL,
    isLoading,
    label: isLoading ? t('general:loading') : t('version:preview'),
    previewURL,
  }
}
