import type i18next from 'i18next'

import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type { SanitizedConfig } from '../../config/types'
import type { SanitizedGlobalConfig } from '../../globals/config/types'
import type { FormField } from '../components/forms/Form/types'

import { getObjectDotNotation } from '../../utilities/getObjectDotNotation'
import { getTranslation } from '../../utilities/getTranslation'
import { useFormFields } from '../components/forms/Form/context'
import { useConfig } from '../components/utilities/Config'
import { formatDate } from '../utilities/formatDate'

// either send the `useAsTitle` field itself
// or an object to dynamically extract the `useAsTitle` field from
export const formatUseAsTitle = (args: {
  collection: SanitizedCollectionConfig
  config: SanitizedConfig
  doc?: Record<string, any>
  field?: FormField
  i18n: typeof i18next
}): string => {
  const {
    collection: {
      admin: { useAsTitle },
    },
    collection,
    config: {
      admin: { dateFormat: dateFormatFromConfig },
    },
    doc,
    field: fieldFromProps,
    i18n,
  } = args

  if (!fieldFromProps && !doc) {
    return ''
  }

  const field = fieldFromProps || getObjectDotNotation<FormField>(doc, collection.admin.useAsTitle)
  let title: string
  if (typeof field === 'string') {
    title = field
  } else if (typeof field === 'number') {
    title = String(field)
  } else {
    title = field?.value as string
  }

  const fieldConfig = collection?.fields?.find((f) => 'name' in f && f?.name === useAsTitle)
  const isDate = fieldConfig?.type === 'date'

  if (title && isDate) {
    const dateFormat = fieldConfig?.admin?.date?.displayFormat || dateFormatFromConfig
    title = formatDate(title, dateFormat, i18n?.language)
  }

  return title
}

// Keep `collection` optional so that component do need to worry about conditionally rendering hooks
// This is so that components which take both `collection` and `global` props can use this hook
const useTitle = (args: {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
}): string => {
  const { collection, global } = args
  const { i18n } = useTranslation()
  const config = useConfig()

  let title: string = ''

  const field = useFormFields(([formFields]) => {
    if (!collection) return
    return formFields[collection?.admin?.useAsTitle]
  })

  if (collection) {
    title = formatUseAsTitle({ collection, config, field, i18n })
  }

  if (global) {
    title = getTranslation(global.label, i18n) || global.slug
  }

  return title
}

export default useTitle
