'use client'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

import { useFormFields } from '../forms/Form/context'
import { formatDocTitle } from '../utilities/formatDocTitle'
import { useTranslation } from '../providers/Translation'
import { getTranslation } from '@payloadcms/translations'

const useTitle = (args: {
  useAsTitle?: SanitizedCollectionConfig['admin']['useAsTitle']
  globalLabel?: SanitizedGlobalConfig['label']
  globalSlug?: SanitizedGlobalConfig['slug']
}): string => {
  const { useAsTitle, globalLabel, globalSlug } = args
  const { i18n } = useTranslation()

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

  return title
}

export default useTitle
