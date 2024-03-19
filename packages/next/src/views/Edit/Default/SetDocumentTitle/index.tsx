'use client'
import type { ClientConfig } from 'payload/types'

import { useFormFields } from '@payloadcms/ui/forms/Form'
import { useDocumentInfo } from '@payloadcms/ui/providers/DocumentInfo'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { formatDocTitle } from '@payloadcms/ui/utilities/formatDocTitle'
import { useEffect, useRef } from 'react'

export const SetDocumentTitle: React.FC<{
  collectionConfig?: ClientConfig['collections'][0]
  config?: ClientConfig
  fallback: string
  globalConfig?: ClientConfig['globals'][0]
}> = (props) => {
  const { collectionConfig, config, fallback, globalConfig } = props

  const useAsTitle = collectionConfig?.admin?.useAsTitle

  const field = useFormFields(([fields]) => (useAsTitle && fields && fields?.[useAsTitle]) || null)

  const hasInitialized = useRef(false)

  const { i18n } = useTranslation()

  const { setDocumentTitle } = useDocumentInfo()

  const dateFormatFromConfig = config?.admin?.dateFormat

  const title = formatDocTitle({
    collectionConfig,
    data: { id: '' },
    dateFormat: dateFormatFromConfig,
    fallback:
      typeof field === 'string'
        ? field
        : typeof field === 'number'
          ? String(field)
          : (field?.value as string) || fallback,
    globalConfig,
    i18n,
  })

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      return
    }

    setDocumentTitle(title)
  }, [setDocumentTitle, title])

  return null
}
