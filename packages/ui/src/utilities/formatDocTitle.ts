// either send the `useAsTitle` field itself

import { ClientConfig, PayloadRequest, SanitizedCollectionConfig } from 'payload/types'
import { FormField } from '../forms/Form/types'
import { getObjectDotNotation } from 'payload/utilities'
// import { formatDate } from './formatDate'

// or an object to dynamically extract the `useAsTitle` field from
export const formatDocTitle = (args: {
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
  doc?: Record<string, any>
  field?: FormField
  dateFormat?: ClientConfig['admin']['dateFormat']
  i18n: PayloadRequest['i18n']
}): string => {
  const { useAsTitle, dateFormat: dateFormatFromProps, doc, field: fieldFromProps, i18n } = args

  if (!fieldFromProps && !doc) {
    return ''
  }

  const field = fieldFromProps || getObjectDotNotation<FormField>(doc, useAsTitle)

  let title = typeof field === 'string' ? field : (field?.value as string)

  // const fieldConfig = collection?.fields?.find((f) => 'name' in f && f?.name === useAsTitle)
  // const isDate = fieldConfig?.type === 'date'

  // if (title && isDate) {
  //   const dateFormat = fieldConfig?.admin?.date?.displayFormat || dateFormatFromProps
  //   title = formatDate(title, dateFormat, i18n?.language)
  // }

  return title
}
