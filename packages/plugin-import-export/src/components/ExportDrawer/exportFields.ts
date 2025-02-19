import type { CollectionConfig, FormState, SanitizedLocalizationConfig } from 'payload'

import { getFilename } from '../../export/getFilename.js'

export const useInitialState = ({
  collectionConfig,
  localization,
}: {
  collectionConfig: CollectionConfig
  localization?: any
}): FormState => {
  const filename = getFilename()

  const locales: string[] =
    localization?.localeCodes ||
    (localization?.locales
      ? localization.locales.map((locale: { label: Record<string, string> | string } | string) =>
          typeof locale === 'string'
            ? locale
            : typeof locale.label === 'string'
              ? locale.label
              : '',
        )
      : []) ||
    []

  const columns = collectionConfig.fields
    .map((field) => ('name' in field ? field.name : null))
    .filter(Boolean)

  return {
    name: {
      initialValue: filename,
      valid: true,
      value: filename,
    },
    columnsToExport: {
      initialValue: columns,
      valid: true,
      value: columns,
    },
    depth: {
      initialValue: 1,
      valid: true,
      value: 1,
    },
    drafts: {
      initialValue: 'false',
      valid: true,
      value: 'false',
    },
    format: {
      initialValue: 'csv',
      valid: true,
      value: 'csv',
    },
    limit: {
      initialValue: 100,
      valid: true,
      value: 100,
    },
    locales: {
      initialValue: locales,
      valid: true,
      value: locales,
    },
    selectionToUse: {
      initialValue: 'currentSelection',
      valid: true,
      value: 'currentSelection',
    },
    sort: {
      initialValue: ['ID'],
      valid: true,
      value: ['ID'],
    },
  }
}
