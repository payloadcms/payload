import type { I18n } from '@payloadcms/translations'
import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import { formatDate } from '@payloadcms/ui'

export const formatTitle = ({
  collectionConfig,
  dateFormat: dateFormatFromConfig,
  globalConfig,
  i18n,
  value,
}: {
  collectionConfig?: SanitizedCollectionConfig
  dateFormat: SanitizedConfig['admin']['dateFormat']
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
  value: string
}): string => {
  let title: string = value

  const useAsTitle = collectionConfig?.admin?.useAsTitle

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

  if (!title) {
    title = `[${i18n.t('general:untitled')}]`
  }

  return title
}
