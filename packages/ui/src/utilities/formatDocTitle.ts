import type { I18n } from '@payloadcms/translations'
import type { FormField, SanitizedCollectionConfig } from 'payload/types'

import { getObjectDotNotation } from 'payload/utilities'

import { formatDate } from './formatDate/index.js'

export const formatDocTitle = (args: {
  dateFormat?: any
  doc?: Record<string, any>
  field?: FormField
  i18n: I18n
  isDate?: boolean
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}): string => {
  const { dateFormat, doc, field: fieldFromProps, i18n, isDate, useAsTitle } = args

  if (!fieldFromProps && !doc) {
    return ''
  }

  const field = fieldFromProps || getObjectDotNotation<FormField>(doc, useAsTitle)

  let title: string
  if (typeof field === 'string') {
    title = field
  } else if (typeof field === 'number') {
    title = String(field)
  } else {
    title = field?.value as string
  }

  if (title && isDate) {
    title = formatDate(title, dateFormat, i18n.language)
  }

  return title
}
