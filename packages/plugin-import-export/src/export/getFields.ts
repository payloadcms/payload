import type { Config, Field, SelectField } from 'payload'

import { getFilename } from './getFilename.js'

export const getFields = (config: Config): Field[] => {
  let localeField: SelectField | undefined
  if (config.localization) {
    localeField = {
      name: 'locale',
      type: 'select',
      label: 'Locale',
      options: [
        {
          label: 'All Locales',
          value: 'all',
        },
        ...config.localization.locales.map((locale) => ({
          label: typeof locale === 'string' ? locale : locale.label,
          value: typeof locale === 'string' ? locale : locale.code,
        })),
      ],
    }
  }

  return [
    {
      type: 'collapsible',
      fields: [
        {
          name: 'name',
          type: 'text',
          defaultValue: () => getFilename(),
          label: 'File Name',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'format',
              type: 'select',
              label: 'Export Format',
              options: [
                {
                  label: 'JSON',
                  value: 'json',
                },
                {
                  label: 'CSV',
                  value: 'csv',
                },
              ],
              required: true,
            },
            {
              name: 'limit',
              type: 'number',
              admin: {
                placeholder: 'No limit',
              },
            },
            {
              name: 'sort',
              type: 'text',
              hasMany: true,
              label: 'Sort By',
              maxRows: 2,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            ...(localeField ? [localeField] : []),
            {
              name: 'drafts',
              type: 'select',
              admin: {
                // TODO: make sure condition works for draft enabled collections
                condition: (data) => {
                  const collectionConfig = (config.collections ?? []).find(
                    (collection) => collection.slug === data.collection,
                  )
                  return Boolean(
                    typeof collectionConfig?.versions === 'object' &&
                      collectionConfig.versions?.drafts,
                  )
                },
              },
              label: 'Drafts',
              options: [
                {
                  label: 'True',
                  value: 'true',
                },
                {
                  label: 'False',
                  value: 'false',
                },
              ],
            },
          ],
        },
        {
          name: 'selectionToUse',
          type: 'radio',
          options: [
            {
              label: 'Use current selection',
              value: 'currentSelection',
            },
            {
              label: 'Use current filters',
              value: 'currentFilters',
            },
            {
              label: 'Use all documents',
              value: 'all',
            },
          ],
        },
        {
          name: 'fields',
          type: 'text',
          admin: {
            components: {
              Field: '@payloadcms/plugin-import-export/rsc#FieldsToExport',
            },
          },
          hasMany: true,
          label: 'Fields to Export',
        },
        {
          name: 'collection',
          type: 'text',
          admin: {
            hidden: true,
          },
          required: true,
        },
        {
          name: 'where',
          type: 'json',
        },
      ],
      label: 'Export Options',
    },
    // {
    //   name: 'preview',
    //   type: 'ui',
    //   admin: {
    //     components: {
    //       // Field:
    //     },
    //   },
    // },
  ]
}
