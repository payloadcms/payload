'use client'
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from '../../providers/Translation'
import { toast } from 'react-toastify'

import type { GeneratePreviewURL } from 'payload/config'

import { useAuth } from '../../providers/Auth'
import { useConfig } from '../../providers/Config'
import { useDocumentInfo } from '../../providers/DocumentInfo'
import { useLocale } from '../../providers/Locale'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent'
import { Button } from '../Button'
import { CustomPreviewButtonProps, DefaultPreviewButtonProps } from 'payload/types'

const baseClass = 'preview-btn'

const DefaultPreviewButton: React.FC<DefaultPreviewButtonProps> = ({
  disabled,
  label,
  preview,
}) => {
  return (
    <Button
      buttonStyle="secondary"
      className={baseClass}
      disabled={disabled}
      onClick={preview}
      size="small"
    >
      {label}
    </Button>
  )
}

type Props = {
  CustomComponent?: CustomPreviewButtonProps
  generatePreviewURL?: GeneratePreviewURL
}

const PreviewButton: React.FC<Props> = ({ CustomComponent, generatePreviewURL }) => {
  const { id, collectionSlug, globalSlug } = useDocumentInfo()

  const [isLoading, setIsLoading] = useState(false)
  const { code: locale } = useLocale()
  const { token } = useAuth()
  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { t } = useTranslation()
  const isGeneratingPreviewURL = useRef(false)

  // we need to regenerate the preview URL every time the button is clicked
  // to do this we need to fetch the document data fresh from the API
  // this will ensure the latest data is used when generating the preview URL
  const preview = useCallback(async () => {
    if (!generatePreviewURL || isGeneratingPreviewURL.current) return
    isGeneratingPreviewURL.current = true

    try {
      setIsLoading(true)

      let url = `${serverURL}${api}`
      if (collectionSlug) url = `${url}/${collectionSlug}/${id}`
      if (globalSlug) url = `${url}/globals/${globalSlug}`

      const data = await fetch(`${url}?draft=true&locale=${locale}&fallback-locale=null`).then(
        (res) => res.json(),
      )
      const previewURL = await generatePreviewURL(data, { locale, token })
      if (!previewURL) throw new Error()
      setIsLoading(false)
      isGeneratingPreviewURL.current = false
      window.open(previewURL, '_blank')
    } catch (err) {
      setIsLoading(false)
      isGeneratingPreviewURL.current = false
      toast.error(t('error:previewing'))
    }
  }, [serverURL, api, collectionSlug, globalSlug, id, generatePreviewURL, locale, token, t])

  return (
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultPreviewButton}
      componentProps={{
        DefaultButton: DefaultPreviewButton,
        disabled: isLoading || !generatePreviewURL,
        label: isLoading ? t('general:loading') : t('version:preview'),
        preview,
      }}
    />
  )
}

export default PreviewButton
