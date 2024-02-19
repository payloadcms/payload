'use client'
import { useEffect } from 'react'
import { useDocumentInfo } from '../../../providers/DocumentInfo'
import { useTranslation } from '../../../providers/Translation'
import { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'
import { useFormFields } from '../../../forms/Form/context'
import { formatDocTitle } from '../../../utilities/formatDocTitle'

export const SetDocumentTitle: React.FC<{
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
  globalLabel?: SanitizedGlobalConfig['label']
  globalSlug?: SanitizedGlobalConfig['slug']
}> = (props) => {
  const { useAsTitle, globalLabel, globalSlug } = props

  const { i18n } = useTranslation()

  const { setDocumentTitle } = useDocumentInfo()

  let title: string = ''

  const field = useFormFields(([fields]) => (fields && fields?.[useAsTitle]) || null)

  if (useAsTitle) {
    title = formatDocTitle({
      useAsTitle,
      field,
      // TODO: Fix this
      // @ts-ignore-next-line
      i18n,
    })
  }

  if (globalLabel) {
    title = typeof globalLabel === 'string' ? globalLabel : globalSlug
    // TODO: Fix this
    // @ts-ignore-next-line
    title = getTranslation(globalLabel, i18n) || globalSlug
  }

  useEffect(() => {
    setDocumentTitle(title)
  }, [setDocumentTitle, title])

  return null
}
