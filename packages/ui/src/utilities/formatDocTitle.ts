import { SanitizedCollectionConfig } from 'payload/types'
import { FormField } from '../forms/Form/types'
import { getObjectDotNotation } from 'payload/utilities'

import type { I18n } from '@payloadcms/translations'
import { formatDate } from './formatDate'

export const formatDocTitle = (args: {
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
  doc?: Record<string, any>
  field?: FormField
  dateFormat?: any
  i18n: I18n
  isDate?: boolean
}): string => {
  const { useAsTitle, dateFormat, doc, field: fieldFromProps, i18n, isDate } = args

  if (!fieldFromProps && !doc) {
    return ''
  }

  const field = fieldFromProps || getObjectDotNotation<FormField>(doc, useAsTitle)

  let title = typeof field === 'string' ? field : (field?.value as string)

  if (title && isDate) {
    title = formatDate(title, dateFormat, i18n?.language)
  }

  return title
}
