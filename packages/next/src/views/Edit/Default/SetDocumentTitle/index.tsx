'use client'
import type { ClientCollectionConfig, ClientConfig, ClientGlobalConfig } from 'payload'

import { useDocumentInfo, useFormFields, useTranslation } from '@payloadcms/ui/client'
import { formatDocTitle } from '@payloadcms/ui/shared'
import { useEffect, useRef } from 'react'

export const SetDocumentTitle: React.FC<{
  collectionConfig?: ClientCollectionConfig
  config?: ClientConfig
  fallback: string
  globalConfig?: ClientGlobalConfig
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
