import type { Config, SanitizedConfig } from '../../config/types.js'
import type { Field, FlattenedField } from '../config/types.js'
export const baseLocalizedMetaFields = (
  config: Config | SanitizedConfig,
  flatten?: boolean,
): Field[] => {
  if (!config.localization || !config.localization.locales) {
    return []
  }

  const localizedMetaFields = config.localization.locales.map((locale) => {
    const code = typeof locale === 'string' ? locale : locale.code

    return {
      name: code,
      type: 'group',
      fields: [
        {
          name: 'status',
          type: 'select',
          options: [
            { label: ({ t }: any) => t('version:draft'), value: 'draft' },
            { label: ({ t }: any) => t('version:published'), value: 'published' },
          ],
        },
        {
          name: 'updatedAt',
          type: 'date',
        },
      ],
      label: code,
    }
  })

  return [
    {
      name: 'localizedMeta',
      type: 'group',
      admin: {
        disableBulkEdit: true,
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
      fields: localizedMetaFields as Field[],
      label: ({ t }: any) => t('localization:localizedMeta'),
      ...(flatten
        ? {
            flattenedFields: localizedMetaFields as FlattenedField[],
          }
        : {}),
    },
  ]
}
