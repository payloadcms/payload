import type { Config, SanitizedConfig } from '../../config/types.js'
import type { Field } from '../config/types.js'
export const baseLocalizedMetaFields = (config: Config | SanitizedConfig): Field[] => {
  if (!config.localization || !config.localization.locales) {
    return []
  }

  return [
    {
      name: '_localizedMeta',
      type: 'group',
      admin: {
        disableBulkEdit: true,
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
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
      ] as Field[],
      label: ({ t }: any) => t('localization:localizedMeta'),
      localized: true,
    },
  ]
}
