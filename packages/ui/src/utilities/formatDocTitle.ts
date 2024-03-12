import type { I18n } from '@payloadcms/translations'
import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  TypeWithID,
} from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import { formatDate } from '@payloadcms/ui'

export const formatDocTitle = ({
  collectionConfig,
  data,
  dateFormat: dateFormatFromConfig,
  fallback,
  globalConfig,
  i18n,
}: {
  collectionConfig?: SanitizedCollectionConfig
  data: TypeWithID
  dateFormat: SanitizedConfig['admin']['dateFormat']
  fallback?: string
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
}): string => {
  let title: string = data?.id?.toString()

  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle

    if (useAsTitle) {
      title = data?.[useAsTitle] || title

      if (title) {
        const fieldConfig = collectionConfig.fields.find(
          (f) => 'name' in f && f.name === useAsTitle,
        )

        const isDate = fieldConfig?.type === 'date'

        if (isDate) {
          const dateFormat = fieldConfig?.admin?.date?.displayFormat || dateFormatFromConfig
          title = formatDate(title, dateFormat, i18n.language) || title
        }
      }
    }
  }

  if (globalConfig) {
    title = getTranslation(globalConfig?.label, i18n) || globalConfig?.slug
  }

  if (!title) {
    title = fallback || `[${i18n.t('general:untitled')}]`
  }

  return title
}
