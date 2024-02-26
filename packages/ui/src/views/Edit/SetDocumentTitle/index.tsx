'use client'
import type { ClientConfig } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import { useEffect } from 'react'

import { formatDate } from '../../..'
import { useFormFields } from '../../../forms/Form/context'
import { useDocumentInfo } from '../../../providers/DocumentInfo'
import { useTranslation } from '../../../providers/Translation'

export const SetDocumentTitle: React.FC<{
  collectionConfig?: ClientConfig['collections'][0]
  config?: ClientConfig
  globalConfig?: ClientConfig['globals'][0]
}> = (props) => {
  const { collectionConfig, config, globalConfig } = props

  const dateFormatFromConfig = config?.admin?.dateFormat

  const useAsTitle = collectionConfig?.admin?.useAsTitle

  const field = useFormFields(([fields]) => (useAsTitle && fields && fields?.[useAsTitle]) || null)

  const { i18n } = useTranslation()

  const { setDocumentTitle } = useDocumentInfo()

  let title: string

  if (typeof field === 'string') {
    title = field
  } else if (typeof field === 'number') {
    title = String(field)
  } else {
    title = field?.value as string
  }

  if (collectionConfig && useAsTitle) {
    const fieldConfig = collectionConfig.fields.find((f) => 'name' in f && f.name === useAsTitle)
    const isDate = fieldConfig?.type === 'date'

    if (title && isDate) {
      const dateFormat = fieldConfig?.admin?.date?.displayFormat || dateFormatFromConfig
      title = formatDate(title, dateFormat, i18n.language)
    }
  }

  if (globalConfig) {
    title = getTranslation(globalConfig?.label, i18n) || globalConfig?.slug
  }

  useEffect(() => {
    setDocumentTitle(title)
  }, [setDocumentTitle, title])

  return null
}
