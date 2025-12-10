import type { TFunction } from '@payloadcms/translations'
import type { Config, Field, SelectField } from 'payload'

import { getFilename } from '../utilities/getFilename.js'
import { validateLimitValue } from '../utilities/validateLimitValue.js'

type GetFieldsOptions = {
  /**
   * Force a specific format, hiding the format dropdown
   */
  format?: 'csv' | 'json'
}

export const getFields = (config: Config, options?: GetFieldsOptions): Field[] => {
  const format = options?.format
  let localeField: SelectField | undefined
  if (config.localization) {
    localeField = {
      name: 'locale',
      type: 'select',
      admin: {
        width: '25%',
      },
      defaultValue: 'all',
      // @ts-expect-error - this is not correctly typed in plugins right now
      label: ({ t }) => t('plugin-import-export:field-locale-label'),
      options: [
        {
          label: ({ t }) => t('general:allLocales'),
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
          // @ts-expect-error - this is not correctly typed in plugins right now
          label: ({ t }) => t('plugin-import-export:field-name-label'),
        },
        {
          type: 'row',
          fields: [
            {
              name: 'format',
              type: 'select',
              admin: {
                // Hide if a forced format is set via config
                condition: () => !format,
                width: '33.3333%',
              },
              defaultValue: format ?? 'csv',
              // @ts-expect-error - this is not correctly typed in plugins right now
              label: ({ t }) => t('plugin-import-export:field-format-label'),
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
                step: 100,
                width: '33.3333%',
              },
              validate: (value: null | number | undefined, { req }: { req: { t: TFunction } }) => {
                return validateLimitValue(value, req.t) ?? true
              },
              // @ts-expect-error - this is not correctly typed in plugins right now
              label: ({ t }) => t('plugin-import-export:field-limit-label'),
            },
            {
              name: 'page',
              type: 'number',
              admin: {
                components: {
                  Field: '@payloadcms/plugin-import-export/rsc#Page',
                },
                condition: ({ limit }) => {
                  // Show the page field only if limit is set
                  return typeof limit === 'number' && limit !== 0
                },
                width: '33.3333%',
              },
              defaultValue: 1,
              // @ts-expect-error - this is not correctly typed in plugins right now
              label: ({ t }) => t('plugin-import-export:field-page-label'),
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'sort',
              type: 'text',
              admin: {
                components: {
                  Field: '@payloadcms/plugin-import-export/rsc#SortBy',
                },
              },
              // @ts-expect-error - this is not correctly typed in plugins right now
              label: ({ t }) => t('plugin-import-export:field-sort-label'),
            },
            {
              name: 'sortOrder',
              type: 'select',
              admin: {
                components: {
                  Field: '@payloadcms/plugin-import-export/rsc#SortOrder',
                },
                // Only show when `sort` has a value
                condition: ({ sort }) => typeof sort === 'string' && sort.trim().length > 0,
              },
              // @ts-expect-error - this is not correctly typed in plugins right now
              label: ({ t }) => t('plugin-import-export:field-sort-order-label'),
              options: [
                { label: 'Ascending', value: 'asc' },
                { label: 'Descending', value: 'desc' },
              ],
            },
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
                width: '25%',
              },
              defaultValue: 'yes',
              // @ts-expect-error - this is not correctly typed in plugins right now
              label: ({ t }) => t('plugin-import-export:field-drafts-label'),
              options: [
                {
                  label: ({ t }) => t('general:yes'),
                  value: 'yes',
                },
                {
                  label: ({ t }) => t('general:no'),
                  value: 'no',
                },
              ],
            },
            // {
            //   name: 'depth',
            //   type: 'number',
            //   // @ts-expect-error - this is not correctly typed in plugins right now
            //   label: ({ t }) => t('plugin-import-export:field-depth-label'),
            //   admin: {
            //     width: '33%',
            //   },
            //   defaultValue: 1,
            //   required: true,
            // },
          ],
        },
        {
          name: 'selectionToUse',
          type: 'radio',
          admin: {
            components: {
              Field: '@payloadcms/plugin-import-export/rsc#SelectionToUseField',
            },
          },
          options: [
            {
              // @ts-expect-error - this is not correctly typed in plugins right now
              label: ({ t }) => t('plugin-import-export:selectionToUse-currentSelection'),
              value: 'currentSelection',
            },
            {
              // @ts-expect-error - this is not correctly typed in plugins right now
              label: ({ t }) => t('plugin-import-export:selectionToUse-currentFilters'),
              value: 'currentFilters',
            },
            {
              // @ts-expect-error - this is not correctly typed in plugins right now
              label: ({ t }) => t('plugin-import-export:selectionToUse-allDocuments'),
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
          // @ts-expect-error - this is not correctly typed in plugins right now
          label: ({ t }) => t('plugin-import-export:field-fields-label'),
        },
        {
          name: 'collectionSlug',
          type: 'text',
          admin: {
            components: {
              Field: '@payloadcms/plugin-import-export/rsc#CollectionField',
            },
          },
          required: true,
        },
        {
          name: 'where',
          type: 'json',
          admin: {
            hidden: true,
          },
          defaultValue: {},
          hooks: {
            beforeValidate: [
              ({ value }) => {
                return value ?? {}
              },
            ],
          },
        },
      ],
      // @ts-expect-error - this is not correctly typed in plugins right now
      label: ({ t }) => t('plugin-import-export:exportOptions'),
    },
    {
      name: 'preview',
      type: 'ui',
      admin: {
        components: {
          Field: '@payloadcms/plugin-import-export/rsc#ExportPreview',
        },
      },
    },
  ]
}
