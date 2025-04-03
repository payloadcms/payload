import type { Config, Field, SelectField } from 'payload'

import { getFilename } from './getFilename.js'

export const getFields = (config: Config): Field[] => {
  let localeField: SelectField | undefined
  if (config.localization) {
    localeField = {
      name: 'locale',
      type: 'select',
      admin: {
        width: '33%',
      },
      defaultValue: 'all',
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
              admin: {
                width: '33%',
              },
              defaultValue: 'csv',
              label: 'Export Format',
              options: [
                {
                  label: 'CSV',
                  value: 'csv',
                },
                {
                  label: 'JSON',
                  value: 'json',
                },
              ],
              required: true,
            },
            {
              name: 'limit',
              type: 'number',
              admin: {
                placeholder: 'No limit',
                width: '33%',
              },
            },
            {
              name: 'sort',
              type: 'text',
              admin: {
                components: {
                  Field: '@payloadcms/plugin-import-export/rsc#SortBy',
                },
              },
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
                condition: (data) => {
                  const collectionConfig = (config.collections ?? []).find(
                    (collection) => collection.slug === data.collectionSlug,
                  )
                  return Boolean(
                    typeof collectionConfig?.versions === 'object' &&
                      collectionConfig?.versions?.drafts,
                  )
                },
                width: '33%',
              },
              defaultValue: 'yes',
              label: 'Drafts',
              options: [
                {
                  label: 'Yes',
                  value: 'yes',
                },
                {
                  label: 'No',
                  value: 'no',
                },
              ],
            },
            // {
            //   name: 'depth',
            //   type: 'number',
            //   admin: {
            //     width: '33%',
            //   },
            //   defaultValue: 1,
            //   required: true,
            // },
          ],
        },
        {
          // virtual field for the UI component to modify the hidden `where` field
          name: 'selectionToUse',
          type: 'radio',
          defaultValue: 'all',
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
          virtual: true,
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
        },
        {
          name: 'collectionSlug',
          type: 'text',
          admin: {
            components: {
              Field: '@payloadcms/plugin-import-export/rsc#CollectionField',
            },
            hidden: true,
          },
          required: true,
        },
        {
          name: 'where',
          type: 'json',
          admin: {
            components: {
              Field: '@payloadcms/plugin-import-export/rsc#WhereField',
            },
          },
          defaultValue: {},
        },
      ],
      label: 'Export Options',
    },
    {
      name: 'preview',
      type: 'ui',
      admin: {
        components: {
          Field: '@payloadcms/plugin-import-export/rsc#Preview',
        },
      },
    },
  ]
}
