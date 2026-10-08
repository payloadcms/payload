'use client'
import type { ClientCollectionConfig, ClientConfig, ClientGlobalConfig } from 'payload'

import { useEffect, useRef } from 'react'

import { useFormFields } from '../../../forms/Form/context.js'
import { useDocumentTitle } from '../../../providers/DocumentTitle/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatDocTitle } from '../../../utilities/formatDocTitle/index.js'

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

  const { setDocumentTitle } = useDocumentTitle()

  const dateFormatFromConfig = config?.admin?.dateFormat

  const title = formatDocTitle({
    collectionConfig,
    data: { id: '', [useAsTitle]: field?.value || '' },
    dateFormat: dateFormatFromConfig,
    fallback,
    globalConfig,
    i18n,
  })

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      return
    }

    // Coalesce rapid field changes before updating the title and step navigation contexts.
    const animationFrame = requestAnimationFrame(() => {
      setDocumentTitle(title)
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [setDocumentTitle, title])

  return null
}
