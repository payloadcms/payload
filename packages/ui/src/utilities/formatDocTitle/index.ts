import type { I18n } from '@ruya.sa/translations'
import type {
  ClientCollectionConfig,
  ClientGlobalConfig,
  SanitizedConfig,
  TypeWithID,
} from '@ruya.sa/payload'

import { getTranslation } from '@ruya.sa/translations'

import { formatDate } from './formatDateTitle.js'
import { formatLexicalDocTitle, isSerializedLexicalEditor } from './formatLexicalDocTitle.js'
import { formatRelationshipTitle } from './formatRelationshipTitle.js'

export const formatDocTitle = ({
  collectionConfig,
  data,
  dateFormat: dateFormatFromConfig,
  fallback,
  globalConfig,
  i18n,
}: {
  collectionConfig?: ClientCollectionConfig
  data: TypeWithID
  dateFormat: SanitizedConfig['admin']['dateFormat']
  fallback?: object | string
  globalConfig?: ClientGlobalConfig
  i18n: I18n<any, any>
}): string => {
  let title: string

  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle

    if (useAsTitle) {
      title = data?.[useAsTitle] as string

      if (title) {
        const fieldConfig = collectionConfig.fields.find(
          (f) => 'name' in f && f.name === useAsTitle,
        )

        const isDate = fieldConfig?.type === 'date'
        const isRelationship = fieldConfig?.type === 'relationship'

        if (isDate) {
          const dateFormat =
            ('date' in fieldConfig.admin && fieldConfig?.admin?.date?.displayFormat) ||
            dateFormatFromConfig

          title = formatDate({ date: title, i18n, pattern: dateFormat }) || title
        }

        if (isRelationship) {
          const formattedRelationshipTitle = formatRelationshipTitle(data[useAsTitle])
          title = formattedRelationshipTitle
        }
      }
    }
  }

  if (globalConfig) {
    title = getTranslation(globalConfig?.label, i18n) || globalConfig?.slug
  }

  // richtext lexical case. We convert the first child of root to plain text
  if (title && isSerializedLexicalEditor(title)) {
    title = formatLexicalDocTitle(title.root.children?.[0]?.children || [], '')
  }

  if (!title && isSerializedLexicalEditor(fallback)) {
    title = formatLexicalDocTitle(fallback.root.children?.[0]?.children || [], '')
  }

  if (!title) {
    title = typeof fallback === 'string' ? fallback : `[${i18n.t('general:untitled')}]`
  }

  return title
}
