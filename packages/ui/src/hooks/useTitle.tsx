'use client'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig, ClientConfig } from 'payload/types'

import { useFormFields } from '../forms/Form/context'
import { formatDocTitle } from '../utilities/formatDocTitle'
import { useTranslation } from 'react-i18next'
import { getTranslation } from 'payload/utilities'

const useTitle = (args: {
  useAsTitle?: SanitizedCollectionConfig['admin']['useAsTitle']
  globalLabel?: SanitizedGlobalConfig['label']
  globalSlug?: SanitizedGlobalConfig['slug']
}): string => {
  const { useAsTitle, globalLabel, globalSlug } = args
  const { i18n } = useTranslation()

  let title: string = ''

  const field = useFormFields(([formFields]) => formFields[useAsTitle])

  if (useAsTitle) {
    title = formatDocTitle({
      useAsTitle,
      field,
      i18n,
    })
  }

  if (globalLabel) {
    title = typeof globalLabel === 'string' ? globalLabel : globalSlug
    title = getTranslation(globalLabel, i18n) || globalSlug
  }

  return title
}

export default useTitle
