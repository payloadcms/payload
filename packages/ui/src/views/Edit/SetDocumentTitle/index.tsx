'use client'
import { useEffect } from 'react'
import { useDocumentInfo } from '../../../providers/DocumentInfo'
import { useTranslation } from '../../../providers/Translation'
import { ClientConfig } from 'payload/types'
import { useFormFields } from '../../../forms/Form/context'
import { formatDate } from '../../..'
import { getTranslation } from '@payloadcms/translations'

export const SetDocumentTitle: React.FC<{
  config?: ClientConfig
  globalConfig?: ClientConfig['globals'][0]
  collectionConfig?: ClientConfig['collections'][0]
}> = (props) => {
  const { config, globalConfig, collectionConfig } = props

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
