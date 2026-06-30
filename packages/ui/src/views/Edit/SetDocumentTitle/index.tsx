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

  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined

  const useAsTitle = collectionConfig?.admin?.useAsTitle

  // When usePathAsTitle is enabled, watch the virtual path field for real-time title updates.
  // Since it's read-only/virtual, it only updates after a server save.
  const fieldNameToWatch =
    (hierarchyConfig?.admin?.usePathAsTitle && hierarchyConfig.titlePathFieldName) ||
    useAsTitle ||
    ''

  const field = useFormFields(
    ([fields]) => (fieldNameToWatch && fields && fields?.[fieldNameToWatch]) || null,
  )

  const hasInitialized = useRef(false)

  const { i18n } = useTranslation()

  const { setDocumentTitle } = useDocumentTitle()

  const dateFormatFromConfig = config?.admin?.dateFormat

  let title: string
  if (hierarchyConfig?.admin?.usePathAsTitle && typeof field?.value === 'string' && field.value) {
    title = field.value
  } else {
    title = formatDocTitle({
      collectionConfig,
      data: { id: '', [useAsTitle || '']: field?.value || '' },
      dateFormat: dateFormatFromConfig,
      fallback,
      globalConfig,
      i18n,
    })
  }

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      return
    }

    setDocumentTitle(title)
  }, [setDocumentTitle, title])

  return null
}
