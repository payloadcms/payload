'use client'

import { SaveButton, useField, useTranslation } from '@payloadcms/ui'

import type {
  PluginImportExportTranslationKeys,
  PluginImportExportTranslations,
} from '../../translations/index.js'

export const ImportSaveButton: React.FC = () => {
  const { t } = useTranslation<PluginImportExportTranslations, PluginImportExportTranslationKeys>()
  const { value: status } = useField<string>({ path: 'status' })

  // Only show the button if status is pending
  if (status !== 'pending') {
    return null
  }

  return <SaveButton label={t('plugin-import-export:startImport')} />
}
