import { I18n, getTranslation } from '@payloadcms/translations'
import { formatDate } from '@payloadcms/ui'
import { SanitizedCollectionConfig, SanitizedConfig, SanitizedGlobalConfig } from 'payload/types'

export const formatTitle = ({
  value,
  collectionConfig,
  globalConfig,
  i18n,
  dateFormat: dateFormatFromConfig,
}: {
  value: string
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
  dateFormat: SanitizedConfig['admin']['dateFormat']
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

  return title
}
