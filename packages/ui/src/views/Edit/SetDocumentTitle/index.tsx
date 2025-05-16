'use client'
import type { ClientCollectionConfig, ClientConfig, ClientGlobalConfig, FieldState } from 'payload'

import { useEffect, useRef } from 'react'

import { useFormFields } from '../../../forms/Form/context.js'
import { useEffectEvent } from '../../../hooks/useEffectEvent.js'
import { useDocumentInfo, useDocumentTitle } from '../../../providers/DocumentInfo/index.js'
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

  const { setDocumentTitle } = useDocumentInfo()

  const dateFormatFromConfig = config?.admin?.dateFormat

  const doSet = useEffectEvent((field: FieldState) => {
    setDocumentTitle(
      formatDocTitle({
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
      }),
    )
  })

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      return
    }

    doSet(field)
  }, [field])

  return null
}
