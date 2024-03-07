'use client'
import type { ClientConfig } from 'payload/types'

import { useDocumentInfo, useFormFields, useTranslation } from '@payloadcms/ui'
import { useEffect, useRef } from 'react'

import { formatTitle } from './formatTitle.js'

export const SetDocumentTitle: React.FC<{
  collectionConfig?: ClientConfig['collections'][0]
  config?: ClientConfig
  globalConfig?: ClientConfig['globals'][0]
}> = (props) => {
  const { collectionConfig, config, globalConfig } = props

  const useAsTitle = collectionConfig?.admin?.useAsTitle

  const field = useFormFields(([fields]) => (useAsTitle && fields && fields?.[useAsTitle]) || null)

  const hasInitialized = useRef(false)

  const { i18n } = useTranslation()

  const { setDocumentTitle } = useDocumentInfo()

  const dateFormatFromConfig = config?.admin?.dateFormat

  const title = formatTitle({
    collectionConfig,
    dateFormat: dateFormatFromConfig,
    globalConfig,
    i18n,
    value:
      typeof field === 'string'
        ? field
        : typeof field === 'number'
          ? String(field)
          : (field?.value as string),
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
